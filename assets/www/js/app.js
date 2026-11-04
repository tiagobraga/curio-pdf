/**
 * app.js - Orquestrador Móvel do Curió PDF com integração ao Lomiri Content Hub
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations();
  }

  const elements = {
    docTitle: document.getElementById('doc-title'),
    docSubtitle: document.getElementById('doc-subtitle'),
    headerPageNum: document.getElementById('header-page-num'),
    headerTotalNum: document.getElementById('header-total-num'),
    btnBack: document.getElementById('btn-back'),
    btnSearch: document.getElementById('btn-search'),
    btnTheme: document.getElementById('btn-theme'),

    searchBar: document.getElementById('search-bar'),
    searchInput: document.getElementById('search-input'),
    searchCount: document.getElementById('search-count'),
    btnSearchPrev: document.getElementById('btn-search-prev'),
    btnSearchNext: document.getElementById('btn-search-next'),
    btnSearchClose: document.getElementById('btn-search-close'),

    highlighterTools: document.getElementById('highlighter-tools'),
    modeTextBtn: document.getElementById('mode-text-btn'),
    modeInkBtn: document.getElementById('mode-ink-btn'),
    touchColors: document.querySelectorAll('.touch-color'),

    homeView: document.getElementById('home-view'),
    fileInput: document.getElementById('file-input'),
    btnOpenFile: document.getElementById('btn-open-file'),
    recentList: document.getElementById('recent-list'),

    pdfContainer: document.getElementById('pdf-viewer-container'),
    bottomBar: document.getElementById('bottom-bar'),
    btnOutline: document.getElementById('btn-outline'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnFitScreen: document.getElementById('btn-fit-screen'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnHighlightToggle: document.getElementById('btn-highlight-toggle'),
    btnExport: document.getElementById('btn-export'),

    drawer: document.getElementById('drawer'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
    btnDrawerClose: document.getElementById('btn-drawer-close'),
    tabOutline: document.getElementById('tab-outline'),
    tabHighlights: document.getElementById('tab-highlights'),
    drawerOutlineContent: document.getElementById('drawer-outline-content'),
    drawerHighlightsContent: document.getElementById('drawer-highlights-content'),

    toast: document.getElementById('toast')
  };

  let currentDoc = null; // { docId, name, pdfData }
  let pdfViewer = null;
  let highlighter = null;
  let isDarkMode = false;
  let isPdfInverted = false;

  function showToast(msg) {
    elements.toast.innerText = msg;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 2600);
  }

  // Inicializar Visualizador e Marca-texto
  pdfViewer = new PdfViewer(elements.pdfContainer, {
    onPageChange: (current, total, ratio) => {
      if (elements.headerPageNum && elements.headerTotalNum) {
        elements.headerPageNum.innerText = current;
        elements.headerTotalNum.innerText = total;
      }

      if (currentDoc) {
        window.appStorage.saveDocument({
          docId: currentDoc.docId,
          name: currentDoc.name,
          currentPage: current,
          totalPages: total,
          scrollRatio: ratio
        }).catch(console.error);
      }
    },
    onPageRendered: (pageNum, pageEl) => {
      if (highlighter) {
        highlighter.renderHighlightsForPage(pageNum, pageEl);
      }
    },
    onOutlineLoaded: (outline) => {
      renderOutlineDrawer(outline);
    }
  });

  highlighter = new PdfHighlighter(pdfViewer, window.appStorage, {
    onHighlightsChanged: (highlights) => {
      renderHighlightsDrawer(highlights);
    }
  });

  // Carregar Lista de Recentes
  async function loadRecents() {
    try {
      const recents = await window.appStorage.getRecentDocuments();
      if (!recents || recents.length === 0) {
        const noRecentMsg = window.i18n ? window.i18n.t('no_recent') : 'Nenhum documento recente.';
        elements.recentList.innerHTML = `<div class="empty-recents">${noRecentMsg}</div>`;
        return;
      }

      elements.recentList.innerHTML = '';
      recents.forEach(item => {
        const card = document.createElement('div');
        card.className = 'recent-card';

        const percent = Math.min(Math.round(((item.currentPage || 1) / (item.totalPages || 1)) * 100), 100);
        const pageInd = window.i18n
          ? window.i18n.t('page_indicator', { current: item.currentPage || 1, total: item.totalPages || 1 })
          : `Pág. ${item.currentPage || 1} de ${item.totalPages || 1}`;
        const removeTitle = window.i18n ? window.i18n.t('remove_recent_title') : 'Remover dos recentes';

        card.innerHTML = `
          <div class="recent-info">
            <div class="recent-filename" title="${item.name}">${item.name}</div>
            <div class="recent-meta">
              <span>${pageInd} (${percent}%)</span>
              <span>${new Date(item.lastOpened).toLocaleDateString()}</span>
            </div>
            <div class="recent-progress-bar">
              <div class="recent-progress-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
          <button class="touch-btn sm delete-recent" title="${removeTitle}" style="color: var(--text-muted);">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        `;

        card.addEventListener('click', async (e) => {
          if (e.target.closest('.delete-recent')) {
            e.stopPropagation();
            await window.appStorage.deleteDocument(item.docId);
            loadRecents();
            showToast(window.i18n ? window.i18n.t('doc_removed') : 'Documento removido dos recentes');
            return;
          }

          const fullDoc = await window.appStorage.getDocument(item.docId);
          if (fullDoc && fullDoc.pdfData) {
            openPdfDocument(fullDoc.pdfData, fullDoc.name, fullDoc.docId, fullDoc.scrollRatio);
          } else {
            showToast(window.i18n ? window.i18n.t('original_not_found') : 'Arquivo original não encontrado. Abra pelo botão principal.');
          }
        });

        elements.recentList.appendChild(card);
      });
    } catch (e) {
      console.error('Erro ao carregar recentes:', e);
    }
  }

  // Abertura de Arquivo PDF
  async function openPdfDocument(arrayBuffer, fileName, existingDocId = null, initialRatio = 0) {
    try {
      showToast(window.i18n ? window.i18n.t('loading_doc') : 'Abrindo documento...');
      const docId = existingDocId || await AppStorage.computeHash(arrayBuffer);

      currentDoc = {
        docId: docId,
        name: fileName,
        pdfData: arrayBuffer
      };

      elements.docTitle.innerText = fileName;
      elements.docSubtitle.style.display = 'block';
      elements.homeView.style.display = 'none';
      elements.pdfContainer.style.display = 'flex';
      elements.bottomBar.style.display = 'flex';
      elements.btnBack.style.display = 'flex';
      elements.btnSearch.style.display = 'flex';
      elements.searchBar.style.display = 'none';
      elements.highlighterTools.style.display = 'none';
      elements.btnHighlightToggle.classList.remove('active');
      highlighter.setMode('off');

      const totalPages = await pdfViewer.loadDocument(arrayBuffer, docId, initialRatio);
      elements.headerTotalNum.innerText = totalPages;

      await window.appStorage.saveDocument({
        docId: docId,
        name: fileName,
        totalPages: totalPages,
        pdfData: arrayBuffer
      });

      await highlighter.loadHighlightsForDoc(docId);
    } catch (err) {
      console.error('Erro ao abrir PDF:', err);
      showToast((window.i18n ? window.i18n.t('error_open') : 'Falha ao abrir PDF: ') + err.message);
    }
  }

  function closePdfDocument() {
    currentDoc = null;
    elements.homeView.style.display = 'flex';
    elements.pdfContainer.style.display = 'none';
    elements.bottomBar.style.display = 'none';
    elements.btnBack.style.display = 'none';
    elements.btnSearch.style.display = 'none';
    elements.searchBar.style.display = 'none';
    elements.highlighterTools.style.display = 'none';
    elements.docSubtitle.style.display = 'none';
    elements.docTitle.innerText = 'Curió PDF';
    elements.btnHighlightToggle.classList.remove('active');
    highlighter.setMode('off');
    loadRecents();
  }

  // Ação de Abrir Arquivo: Aciona o seletor nativo do Content Hub via backend local (idêntico ao Assinei)
  elements.btnOpenFile.addEventListener('click', async () => {
    try {
      const resp = await fetch('/api/request-open-dialog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!resp.ok) {
        elements.fileInput.click();
      }
    } catch (e) {
      elements.fileInput.click();
    }
  });

  // Função global chamada pelo QML que entrega os bytes em Base64 (100% livre de fetch/CORS)
  window.loadPdfFromBase64 = async function(base64Data, fileName) {
    try {
      showToast((window.i18n ? window.i18n.t('loading_doc') : 'Carregando ') + fileName + '...');
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      await openPdfDocument(bytes.buffer, fileName);
    } catch (err) {
      console.error('Erro ao processar Base64 do PDF:', err);
      showToast((window.i18n ? window.i18n.t('error_open') : 'Erro ao abrir documento: ') + err.message);
    }
  };

  // Fallback para URL caso ainda seja chamado
  window.loadPdfFromUrl = async function(fileUrl) {
    try {
      showToast(window.i18n ? window.i18n.t('loading_doc') : 'Carregando documento...');
      const fileName = decodeURIComponent(fileUrl.split('/').pop() || 'documento.pdf');
      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();
      await openPdfDocument(buffer, fileName);
    } catch (err) {
      console.warn('loadPdfFromUrl falhou:', err);
    }
  };

  // Fallback para input de arquivo HTML
  elements.fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      const buffer = await file.arrayBuffer();
      openPdfDocument(buffer, file.name);
    }
    elements.fileInput.value = '';
  });

  elements.btnBack.addEventListener('click', closePdfDocument);

  // Barra de Busca Móvel
  elements.btnSearch.addEventListener('click', () => {
    const isVisible = elements.searchBar.style.display === 'flex';
    elements.searchBar.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      elements.searchInput.focus();
    }
  });

  elements.btnSearchClose.addEventListener('click', () => {
    elements.searchBar.style.display = 'none';
    elements.searchInput.value = '';
    elements.searchCount.innerText = '';
    pdfViewer.search('');
  });

  let searchTimeout;
  elements.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const query = elements.searchInput.value;
      const res = await pdfViewer.search(query);
      elements.searchCount.innerText = res.total > 0 ? `${res.current}/${res.total}` : (query ? '0' : '');
    }, 250);
  });

  elements.btnSearchNext.addEventListener('click', () => {
    const res = pdfViewer.nextSearchResult();
    if (res.total > 0) elements.searchCount.innerText = `${res.current}/${res.total}`;
  });

  elements.btnSearchPrev.addEventListener('click', () => {
    const res = pdfViewer.prevSearchResult();
    if (res.total > 0) elements.searchCount.innerText = `${res.current}/${res.total}`;
  });

  // Barra de Ferramentas do Marca-texto Móvel
  elements.btnHighlightToggle.addEventListener('click', () => {
    const isVisible = elements.highlighterTools.style.display === 'flex';
    elements.highlighterTools.style.display = isVisible ? 'none' : 'flex';
    elements.btnHighlightToggle.classList.toggle('active', !isVisible);

    if (!isVisible) {
      highlighter.setMode('text');
      elements.modeTextBtn.classList.add('active');
      elements.modeInkBtn.classList.remove('active');
      showToast(window.i18n ? window.i18n.t('highlighter_on') : 'Marca-texto ativado: selecione o texto para grifar');
    } else {
      highlighter.setMode('off');
    }
  });

  elements.modeTextBtn.addEventListener('click', () => {
    elements.modeTextBtn.classList.add('active');
    elements.modeInkBtn.classList.remove('active');
    highlighter.setMode('text');
    showToast(window.i18n ? window.i18n.t('mode_text_msg') : 'Modo: Selecionar texto');
  });

  elements.modeInkBtn.addEventListener('click', () => {
    elements.modeInkBtn.classList.add('active');
    elements.modeTextBtn.classList.remove('active');
    highlighter.setMode('ink');
    showToast(window.i18n ? window.i18n.t('mode_ink_msg') : 'Modo: Caneta livre com o dedo');
  });

  elements.touchColors.forEach(dot => {
    dot.addEventListener('click', () => {
      elements.touchColors.forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      const color = dot.dataset.color;
      highlighter.setColor(color);
    });
  });

  // Ajustar à Tela e Controles de Zoom (Estilo Assinei!)
  elements.btnFitScreen.addEventListener('click', () => {
    pdfViewer.fitToWidth();
    showToast(window.i18n ? window.i18n.t('fit_screen_msg') : 'Visualização ajustada à tela');
  });

  if (elements.btnZoomIn) {
    elements.btnZoomIn.addEventListener('click', () => {
      pdfViewer.setZoom(0.2);
    });
  }

  if (elements.btnZoomOut) {
    elements.btnZoomOut.addEventListener('click', () => {
      pdfViewer.setZoom(-0.2);
    });
  }

  // Gesto de Pinch-to-zoom exclusivo nas páginas do PDF (mantém ferramentas e paletas no tamanho original)
  let initialPinchDist = null;
  let initialPinchZoom = 1.0;

  elements.pdfContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      initialPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchZoom = pdfViewer.zoomMultiplier;
    }
  }, { passive: true });

  elements.pdfContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDist) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / initialPinchDist;
      const targetZoom = initialPinchZoom * ratio;
      if (Math.abs(targetZoom - pdfViewer.zoomMultiplier) > 0.12) {
        pdfViewer.setZoomTo(targetZoom);
      }
    }
  }, { passive: true });

  elements.pdfContainer.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      initialPinchDist = null;
    }
  }, { passive: true });

  // Tema Noturno
  elements.btnTheme.addEventListener('click', () => {
    if (!isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
      elements.pdfContainer.classList.add('invert-pdf');
      isDarkMode = true;
      isPdfInverted = true;
      showToast(window.i18n ? window.i18n.t('night_mode_on') : 'Modo Noturno ativado');
    } else {
      document.body.removeAttribute('data-theme');
      elements.pdfContainer.classList.remove('invert-pdf');
      isDarkMode = false;
      isPdfInverted = false;
      showToast(window.i18n ? window.i18n.t('night_mode_off') : 'Modo Claro ativado');
    }
  });

  // Salvar / Exportar com o Content Hub do Ubuntu Touch (Sem limite de título, via /api/save-pdf)
  elements.btnExport.addEventListener('click', async () => {
    if (!currentDoc || !highlighter) return;
    try {
      showToast(window.i18n ? window.i18n.t('saving_doc') : 'Gravando anotações no PDF...');
      const highlights = highlighter.docHighlights;
      const annotatedBytes = await PdfExporter.exportAnnotatedPdf(currentDoc.pdfData, highlights, currentDoc.name);

      // Converte para Base64 usando chunks para evitar estouro de pilha de argumentos
      const chunkSize = 0x8000;
      const chunks = [];
      const bytes = new Uint8Array(annotatedBytes);
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const sub = bytes.subarray(i, i + chunkSize);
        chunks.push(String.fromCharCode.apply(null, sub));
      }
      const b64Data = window.btoa(chunks.join(''));
      const exportName = currentDoc.name.replace(/\.pdf$/i, '') + '_destacado.pdf';

      const resp = await fetch('/api/save-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: b64Data,
          fileName: exportName
        })
      });

      const resData = await resp.json();
      if (resData && resData.success) {
        showToast(window.i18n ? window.i18n.t('choose_save_location') : 'Escolha onde salvar no Content Hub');
      } else {
        // Fallback navegador se estiver rodando fora do Ubuntu Touch
        PdfExporter.downloadPdfBytes(annotatedBytes, exportName);
        showToast('PDF salvo!');
      }
    } catch (e) {
      console.error('Erro ao exportar:', e);
      showToast((window.i18n ? window.i18n.t('error_open') : 'Erro ao salvar PDF: ') + e.message);
    }
  });

  // Gaveta Lateral Móvel
  function openDrawer() {
    elements.drawer.classList.add('open');
    elements.drawerBackdrop.classList.add('open');
  }

  function closeDrawer() {
    elements.drawer.classList.remove('open');
    elements.drawerBackdrop.classList.remove('open');
  }

  elements.btnOutline.addEventListener('click', openDrawer);
  elements.btnDrawerClose.addEventListener('click', closeDrawer);
  elements.drawerBackdrop.addEventListener('click', closeDrawer);

  elements.tabOutline.addEventListener('click', () => {
    elements.tabOutline.classList.add('active');
    elements.tabHighlights.classList.remove('active');
    elements.drawerOutlineContent.style.display = 'block';
    elements.drawerHighlightsContent.style.display = 'none';
  });

  elements.tabHighlights.addEventListener('click', () => {
    elements.tabHighlights.classList.add('active');
    elements.tabOutline.classList.remove('active');
    elements.drawerHighlightsContent.style.display = 'block';
    elements.drawerOutlineContent.style.display = 'none';
  });

  function renderOutlineDrawer(outline) {
    if (!outline || outline.length === 0) {
      const msg = window.i18n ? window.i18n.t('no_outline') : 'Nenhum sumário estruturado encontrado no documento.';
      elements.drawerOutlineContent.innerHTML = `<div style="color: var(--text-muted); padding: 16px; font-size: 14px;">${msg}</div>`;
      return;
    }

    elements.drawerOutlineContent.innerHTML = '';
    outline.forEach(item => {
      const div = document.createElement('div');
      div.className = 'outline-item';
      div.innerText = item.title;
      div.addEventListener('click', () => {
        pdfViewer.scrollToPage(item.pageNumber);
        closeDrawer();
      });
      elements.drawerOutlineContent.appendChild(div);
    });
  }

  function renderHighlightsDrawer(highlights) {
    if (!highlights || highlights.length === 0) {
      const msg = window.i18n ? window.i18n.t('no_highlights') : 'Nenhum destaque salvo neste PDF.';
      elements.drawerHighlightsContent.innerHTML = `<div style="color: var(--text-muted); padding: 16px; font-size: 14px;">${msg}</div>`;
      return;
    }

    elements.drawerHighlightsContent.innerHTML = '';
    highlights.forEach(hl => {
      const card = document.createElement('div');
      card.className = 'highlight-list-item';
      card.style.borderLeftColor = hl.color;

      const pageText = window.i18n ? window.i18n.t('page_label', { page: hl.pageNumber }) : ('Página ' + hl.pageNumber);
      const modeText = hl.type === 'ink'
        ? (window.i18n ? window.i18n.t('ink_mode') : 'Caneta')
        : (window.i18n ? window.i18n.t('text_mode') : 'Texto');

      card.innerHTML = `
        <div class="highlight-item-text">${hl.text || '[Destaque sem texto]'}</div>
        <div class="highlight-item-meta">
          <span>${pageText} (${modeText})</span>
          <span>${new Date(hl.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        pdfViewer.scrollToPage(hl.pageNumber);
        closeDrawer();
      });

      elements.drawerHighlightsContent.appendChild(card);
    });
  }

  // Carregar recentes ao abrir
  loadRecents();

  // Escuta arquivos entregues pelo Lomiri Content Hub ("Abrir com Curió PDF" ou ContentPeerPicker)
  async function checkPendingFiles() {
    try {
      const resp = await fetch('/api/pending-files');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.files) && data.files.length > 0) {
          for (const item of data.files) {
            if (item.base64) {
              await window.loadPdfFromBase64(item.base64, item.name || 'documento.pdf');
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Backend local ainda não pronto:', e);
    }
  }

  window.addEventListener('ut-check-pending-files', checkPendingFiles);
  setTimeout(checkPendingFiles, 400);
});
