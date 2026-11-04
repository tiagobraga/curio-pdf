/**
 * storage.js - Gerenciador de Armazenamento Local IndexedDB para Leitor PDF Ubuntu Touch
 */
const DB_NAME = 'UTPdfReaderDB';
const DB_VERSION = 1;

class AppStorage {
  constructor() {
    this.db = null;
    this.initPromise = this._init();
  }

  _init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para Documentos Recentes e Dados do PDF
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'docId' });
          docStore.createIndex('lastOpened', 'lastOpened', { unique: false });
        }

        // Store para Destaques e Anotações
        if (!db.objectStoreNames.contains('highlights')) {
          const hlStore = db.createObjectStore('highlights', { keyPath: 'id' });
          hlStore.createIndex('docId', 'docId', { unique: false });
          hlStore.createIndex('docPage', ['docId', 'pageNumber'], { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Falha ao abrir IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async ready() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  // Gera hash simples para identificar o arquivo unicamente
  static async computeHash(arrayBuffer) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const sample = arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 1024 * 1024));
        const hashBuffer = await crypto.subtle.digest('SHA-256', sample);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + '_' + arrayBuffer.byteLength;
      } catch (e) {
        console.warn('Crypto subtle falhou, usando fallback de hash:', e);
      }
    }
    return 'doc_' + arrayBuffer.byteLength + '_' + Date.now();
  }

  // Salvar ou atualizar documento recente
  async saveDocument(doc) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents'], 'readwrite');
      const store = tx.objectStore('documents');

      // Buscar se já existe para preservar pdfData se não fornecido
      const getReq = store.get(doc.docId);
      getReq.onsuccess = () => {
        const existing = getReq.result || {};
        const updated = {
          ...existing,
          ...doc,
          lastOpened: Date.now()
        };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // Obter documento por docId
  async getDocument(docId) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents'], 'readonly');
      const store = tx.objectStore('documents');
      const req = store.get(docId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Listar documentos recentes ordenados por última abertura
  async getRecentDocuments(limit = 20) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents'], 'readonly');
      const store = tx.objectStore('documents');
      const index = store.index('lastOpened');
      const list = [];

      const cursorReq = index.openCursor(null, 'prev');
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor && list.length < limit) {
          const val = cursor.value;
          // Retorna apenas metadados (sem o arraybuffer bruto para leveza na listagem)
          list.push({
            docId: val.docId,
            name: val.name,
            lastOpened: val.lastOpened,
            currentPage: val.currentPage || 1,
            totalPages: val.totalPages || 1,
            scrollRatio: val.scrollRatio || 0,
            zoom: val.zoom || 1.0,
            hasData: !!val.pdfData
          });
          cursor.continue();
        } else {
          resolve(list);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }

  // Excluir documento e todos os seus destaques
  async deleteDocument(docId) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['documents', 'highlights'], 'readwrite');
      tx.objectStore('documents').delete(docId);

      const hlStore = tx.objectStore('highlights');
      const index = hlStore.index('docId');
      const cursorReq = index.openCursor(IDBKeyRange.only(docId));
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // Salvar um destaque
  async saveHighlight(highlight) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['highlights'], 'readwrite');
      const store = tx.objectStore('highlights');
      const data = {
        id: highlight.id || ('hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
        createdAt: highlight.createdAt || Date.now(),
        ...highlight
      };
      const req = store.put(data);
      req.onsuccess = () => resolve(data);
      req.onerror = () => reject(req.error);
    });
  }

  // Obter todos os destaques de um documento
  async getHighlights(docId) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['highlights'], 'readonly');
      const store = tx.objectStore('highlights');
      const index = store.index('docId');
      const list = [];
      const cursorReq = index.openCursor(IDBKeyRange.only(docId));
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          resolve(list);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }

  // Atualizar a cor de um destaque
  async updateHighlightColor(id, newColor) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['highlights'], 'readwrite');
      const store = tx.objectStore('highlights');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (!getReq.result) return reject(new Error('Destaque não encontrado'));
        const updated = { ...getReq.result, color: newColor };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // Excluir um destaque por ID
  async deleteHighlight(id) {
    const db = await this.ready();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['highlights'], 'readwrite');
      const store = tx.objectStore('highlights');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }
}

window.appStorage = new AppStorage();
