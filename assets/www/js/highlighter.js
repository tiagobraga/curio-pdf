/**
 * highlighter.js - Gerenciador de Marca-Texto (Seleção de Texto Inteligente + Traço Livre)
 */

class PdfHighlighter {
  constructor(viewer, storage, options = {}) {
    this.viewer = viewer;
    this.storage = storage;
    this.options = options;

    this.activeMode = 'off'; // 'off' | 'text' | 'ink'
    this.currentColor = '#ffeb3b'; // amarelo padrão
    this.colors = {
      yellow: '#ffeb3b',
      green: '#69f0ae',
      blue: '#40c4ff',
      pink: '#ff80ab'
    };

    this.docHighlights = [];
    this.activePopover = null;
    this.onHighlightsChanged = options.onHighlightsChanged || (() => {});

    // Estado do Traço Livre (Ink)
    this.isDrawing = false;
    this.currentInkPoints = [];
    this.currentDrawingCanvas = null;

    this._bindEvents();
  }

  setMode(mode) {
    this.activeMode = mode;
    document.body.classList.toggle('mode-highlighter-text', mode === 'text');
    document.body.classList.toggle('mode-highlighter-ink', mode === 'ink');
    this._updateInkCanvasesState();
    this._closePopover();
  }

  setColor(hexColor) {
    this.currentColor = hexColor;
  }

  async loadHighlightsForDoc(docId) {
    this.docHighlights = await this.storage.getHighlights(docId);
    this._renderAllVisibleHighlights();
    this.onHighlightsChanged(this.docHighlights);
  }

  _bindEvents() {
    // Monitorar seleção de texto com pequeno delay para suportar eventos touch e seleção nativa
    const onSelectionEnd = (e) => {
      setTimeout(() => this._handleTextSelection(e), 60);
    };

    document.addEventListener('mouseup', onSelectionEnd);
    document.addEventListener('touchend', onSelectionEnd);

    // Fechar popover ao clicar fora
    document.addEventListener('mousedown', (e) => {
      if (this.activePopover && !this.activePopover.contains(e.target) && !e.target.closest('.hl-rect')) {
        this._closePopover();
      }
    });
  }

  _updateInkCanvasesState() {
    const canvases = document.querySelectorAll('.ink-canvas');
    canvases.forEach(canvas => {
      if (this.activeMode === 'ink') {
        canvas.classList.add('active');
        this._attachInkListeners(canvas);
      } else {
        canvas.classList.remove('active');
      }
    });
  }

  _attachInkListeners(canvas) {
    if (canvas._inkBound) return;
    canvas._inkBound = true;

    canvas.addEventListener('pointerdown', (e) => this._onInkStart(e, canvas));
    canvas.addEventListener('pointermove', (e) => this._onInkMove(e, canvas));
    canvas.addEventListener('pointerup', (e) => this._onInkEnd(e, canvas));
    canvas.addEventListener('pointercancel', (e) => this._onInkEnd(e, canvas));
  }

  // Renderiza destaques quando uma página do PDF.js é renderizada
  renderHighlightsForPage(pageNum, pageEl) {
    const hlLayer = pageEl.querySelector('.highlight-layer');
    if (!hlLayer) return;
    hlLayer.innerHTML = '';

    const pageHighlights = this.docHighlights.filter(h => h.pageNumber === pageNum);
    const pageWidth = pageEl.clientWidth;
    const pageHeight = pageEl.clientHeight;

    const inkCanvas = pageEl.querySelector('.ink-canvas');
    if (inkCanvas) {
      const ctx = inkCanvas.getContext('2d');
      ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
      if (this.activeMode === 'ink') {
        inkCanvas.classList.add('active');
        this._attachInkListeners(inkCanvas);
      }
    }

    pageHighlights.forEach(hl => {
      if (hl.type === 'text' && hl.rects) {
        hl.rects.forEach(r => {
          const rectEl = document.createElement('div');
          rectEl.className = 'hl-rect';
          rectEl.dataset.hlId = hl.id;
          rectEl.style.backgroundColor = hl.color;
          rectEl.style.left = `${(r.x * 100).toFixed(3)}%`;
          rectEl.style.top = `${(r.y * 100).toFixed(3)}%`;
          rectEl.style.width = `${(r.w * 100).toFixed(3)}%`;
          rectEl.style.height = `${(r.h * 100).toFixed(3)}%`;

          rectEl.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this._showHighlightOptions(hl, rectEl);
          });

          hlLayer.appendChild(rectEl);
        });
      } else if (hl.type === 'ink' && hl.path && inkCanvas) {
        this._drawInkPath(inkCanvas, hl.path, hl.color);
      }
    });
  }

  _renderAllVisibleHighlights() {
    this.viewer.pageContainers.forEach((pageEl, idx) => {
      const pageNum = idx + 1;
      this.renderHighlightsForPage(pageNum, pageEl);
    });
  }

  // Manipulação de Seleção de Texto Inteligente
  _handleTextSelection(e) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    let pageEl = (commonAncestor.nodeType === Node.ELEMENT_NODE ? commonAncestor : commonAncestor.parentElement)?.closest('.page-container');
    if (!pageEl && range.startContainer) {
      const sNode = range.startContainer;
      pageEl = (sNode.nodeType === Node.ELEMENT_NODE ? sNode : sNode.parentElement)?.closest('.page-container');
    }

    if (!pageEl) return;

    const pageNum = parseInt(pageEl.dataset.pageNumber, 10);
    const pageRect = pageEl.getBoundingClientRect();
    let clientRects = Array.from(range.getClientRects());
    if (clientRects.length === 0) {
      const bRect = range.getBoundingClientRect();
      if (bRect && bRect.width > 0 && bRect.height > 0) {
        clientRects = [bRect];
      }
    }

    if (clientRects.length === 0) return;

    // Normalizar retângulos em porcentagem da página (0.0 a 1.0)
    const normalizedRects = clientRects.map(r => ({
      x: (r.left - pageRect.left) / pageEl.clientWidth,
      y: (r.top - pageRect.top) / pageEl.clientHeight,
      w: r.width / pageEl.clientWidth,
      h: r.height / pageEl.clientHeight
    })).filter(r => r.w > 0.001 && r.h > 0.001 && r.x >= -0.05 && r.y >= -0.05 && r.x <= 1.05 && r.y <= 1.05);

    // Mesclar retângulos da mesma linha para visual contínuo e limpo
    const mergedRects = this._mergeLineRects(normalizedRects);

    if (mergedRects.length === 0) return;

    // Se o modo marca-texto estiver ativo, aplica diretamente
    if (this.activeMode === 'text') {
      this._createHighlight({
        docId: this.viewer.docId,
        pageNumber: pageNum,
        type: 'text',
        color: this.currentColor,
        rects: mergedRects,
        text: text
      });
      selection.removeAllRanges();
    } else {
      // Exibe popover para o usuário escolher aplicar ou cancelar
      this._showSelectionMenu(e, pageEl, mergedRects, text, pageNum);
    }
  }

  _mergeLineRects(rects) {
    if (rects.length <= 1) return rects;
    const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
    const merged = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      // Verifica se estão na mesma linha (y e altura próximos)
      const isSameLine = Math.abs(current.y - next.y) < (current.h * 0.4);
      const isAdjacent = (next.x - (current.x + current.w)) < 0.05;

      if (isSameLine && isAdjacent) {
        const newX = Math.min(current.x, next.x);
        const newY = Math.min(current.y, next.y);
        const newW = Math.max(current.x + current.w, next.x + next.w) - newX;
        const newH = Math.max(current.h, next.h);
        current = { x: newX, y: newY, w: newW, h: newH };
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
    return merged;
  }

  async _createHighlight(hlData) {
    const saved = await this.storage.saveHighlight(hlData);
    this.docHighlights.push(saved);
    const pageEl = this.viewer.pageContainers[saved.pageNumber - 1];
    if (pageEl) {
      this.renderHighlightsForPage(saved.pageNumber, pageEl);
    }
    this.onHighlightsChanged(this.docHighlights);
  }

  // Traço Livre (Ink / Freehand)
  _onInkStart(e, canvas) {
    if (this.activeMode !== 'ink') return;
    this.isDrawing = true;
    this.currentDrawingCanvas = canvas;
    const pageEl = canvas.closest('.page-container');
    const rect = canvas.getBoundingClientRect();

    const pt = {
      x: (e.clientX - rect.left) / pageEl.clientWidth,
      y: (e.clientY - rect.top) / pageEl.clientHeight
    };
    this.currentInkPoints = [pt];
  }

  _onInkMove(e, canvas) {
    if (!this.isDrawing || this.currentDrawingCanvas !== canvas) return;
    const pageEl = canvas.closest('.page-container');
    const rect = canvas.getBoundingClientRect();

    const pt = {
      x: (e.clientX - rect.left) / pageEl.clientWidth,
      y: (e.clientY - rect.top) / pageEl.clientHeight
    };
    this.currentInkPoints.push(pt);

    // Desenhar pré-visualização ao vivo no canvas
    const ctx = canvas.getContext('2d');
    const pts = this.currentInkPoints;
    if (pts.length > 1) {
      ctx.save();
      ctx.strokeStyle = this.currentColor;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.45;

      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
      ctx.restore();
    }
  }

  async _onInkEnd(e, canvas) {
    if (!this.isDrawing || this.currentDrawingCanvas !== canvas) return;
    this.isDrawing = false;
    const pageEl = canvas.closest('.page-container');
    const pageNum = parseInt(pageEl.dataset.pageNumber, 10);

    if (this.currentInkPoints.length > 2) {
      await this._createHighlight({
        docId: this.viewer.docId,
        pageNumber: pageNum,
        type: 'ink',
        color: this.currentColor,
        path: this.currentInkPoints,
        text: `[Destaque livre pág. ${pageNum}]`
      });
    }

    this.currentInkPoints = [];
    this.currentDrawingCanvas = null;
  }

  _drawInkPath(canvas, path, color) {
    if (!path || path.length < 2) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.45;

    ctx.beginPath();
    ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Popovers de Interação
  _showSelectionMenu(e, pageEl, rects, text, pageNum) {
    this._closePopover();
    const pop = document.createElement('div');
    pop.className = 'highlight-popover';

    const colors = [
      { name: 'yellow', hex: '#ffeb3b' },
      { name: 'green', hex: '#69f0ae' },
      { name: 'blue', hex: '#40c4ff' },
      { name: 'pink', hex: '#ff80ab' }
    ];

    colors.forEach(c => {
      const dot = document.createElement('div');
      dot.className = `color-dot dot-${c.name}`;
      dot.title = `Destacar em ${c.name}`;
      dot.onclick = () => {
        this._createHighlight({
          docId: this.viewer.docId,
          pageNumber: pageNum,
          type: 'text',
          color: c.hex,
          rects: rects,
          text: text
        });
        window.getSelection().removeAllRanges();
        this._closePopover();
      };
      pop.appendChild(dot);
    });

    document.body.appendChild(pop);
    this.activePopover = pop;

    const touch = (e && e.changedTouches && e.changedTouches[0]) || (e && e.touches && e.touches[0]);
    const clientX = touch ? touch.clientX : (e && typeof e.clientX === 'number' ? e.clientX : window.innerWidth / 2);
    const clientY = touch ? touch.clientY : (e && typeof e.clientY === 'number' ? e.clientY : window.innerHeight / 2);

    const x = Math.min(Math.max(clientX - 60, 10), window.innerWidth - 160);
    const y = Math.max(clientY - 50, 60);
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
  }

  _showHighlightOptions(highlight, targetEl) {
    this._closePopover();
    const pop = document.createElement('div');
    pop.className = 'highlight-popover';

    const colors = [
      { name: 'yellow', hex: '#ffeb3b' },
      { name: 'green', hex: '#69f0ae' },
      { name: 'blue', hex: '#40c4ff' },
      { name: 'pink', hex: '#ff80ab' }
    ];

    colors.forEach(c => {
      const dot = document.createElement('div');
      dot.className = `color-dot dot-${c.name} ${highlight.color === c.hex ? 'selected' : ''}`;
      dot.onclick = async () => {
        await this.storage.updateHighlightColor(highlight.id, c.hex);
        highlight.color = c.hex;
        const pageEl = this.viewer.pageContainers[highlight.pageNumber - 1];
        if (pageEl) this.renderHighlightsForPage(highlight.pageNumber, pageEl);
        this.onHighlightsChanged(this.docHighlights);
        this._closePopover();
      };
      pop.appendChild(dot);
    });

    // Botão de Excluir Destaque
    const delBtn = document.createElement('button');
    delBtn.className = 'popover-btn delete-btn';
    delBtn.title = 'Remover destaque';
    delBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
    `;
    delBtn.onclick = async () => {
      await this.storage.deleteHighlight(highlight.id);
      this.docHighlights = this.docHighlights.filter(h => h.id !== highlight.id);
      const pageEl = this.viewer.pageContainers[highlight.pageNumber - 1];
      if (pageEl) this.renderHighlightsForPage(highlight.pageNumber, pageEl);
      this.onHighlightsChanged(this.docHighlights);
      this._closePopover();
    };
    pop.appendChild(delBtn);

    document.body.appendChild(pop);
    this.activePopover = pop;

    const rect = targetEl.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2 - 80, 10), window.innerWidth - 180);
    const y = Math.max(rect.top - 45, 60);
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
  }

  _closePopover() {
    if (this.activePopover) {
      this.activePopover.remove();
      this.activePopover = null;
    }
  }
}

window.PdfHighlighter = PdfHighlighter;
