/**
 * pdf-viewer.js - Motor de Visualização de PDF em Rolagem Contínua Virtualizada com PDF.js
 */

if (window.pdfjsLib) {
  if (window.pdfjsWorker) {
    window['pdfjs-dist/build/pdf.worker'] = window.pdfjsWorker;
  }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
}

class PdfViewer {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.options = options;
    this.pdfDoc = null;
    this.docId = null;
    this.totalPages = 0;
    this.currentPage = 1;
    this.scale = 1.0;
    this.zoomMultiplier = 1.0;
    this.baseViewport = null;
    this.pageContainers = [];
    this.renderedPages = new Set();
    this.renderingPages = new Set();
    this.observer = null;
    this.onPageChange = options.onPageChange || (() => {});
    this.onOutlineLoaded = options.onOutlineLoaded || (() => {});
    this.searchResults = [];
    this.currentSearchIndex = -1;
    this.searchTerm = '';

    this._setupScrollListener();
  }

  _setupScrollListener() {
    let scrollTimeout;
    this.container.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this._updateCurrentPageFromScroll();
        this._checkVisiblePages();
      }, 50);
    }, { passive: true });
  }

  _checkVisiblePages() {
    const containerTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight || window.innerHeight;
    const viewMargin = 1200; // Pré-renderiza 1200px acima e abaixo

    for (let i = 0; i < this.pageContainers.length; i++) {
      const pageEl = this.pageContainers[i];
      const pageTop = pageEl.offsetTop;
      const pageBottom = pageTop + pageEl.offsetHeight;

      if (pageBottom >= (containerTop - viewMargin) && pageTop <= (containerTop + containerHeight + viewMargin)) {
        this._renderPage(i + 1);
      }
    }
  }

  _updateCurrentPageFromScroll() {
    const containerTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    const midPoint = containerTop + containerHeight / 3;

    for (let i = 0; i < this.pageContainers.length; i++) {
      const pageEl = this.pageContainers[i];
      if (pageEl.offsetTop <= midPoint && (pageEl.offsetTop + pageEl.offsetHeight) > midPoint) {
        const pageNum = i + 1;
        if (this.currentPage !== pageNum) {
          this.currentPage = pageNum;
          this.onPageChange(this.currentPage, this.totalPages, this.getScrollRatio());
        }
        break;
      }
    }
  }

  getScrollRatio() {
    const maxScroll = this.container.scrollHeight - this.container.clientHeight;
    return maxScroll > 0 ? this.container.scrollTop / maxScroll : 0;
  }

  setScrollRatio(ratio) {
    if (ratio >= 0 && ratio <= 1) {
      const maxScroll = this.container.scrollHeight - this.container.clientHeight;
      this.container.scrollTop = maxScroll * ratio;
    }
  }

  async loadDocument(arrayBuffer, docId, initialRatio = 0) {
    this.docId = docId;
    this.renderedPages.clear();
    this.renderingPages.clear();
    this.container.innerHTML = '';
    this.pageContainers = [];

    // Otimização: Carrega dados do PDF sem tentar acessar CMaps externos inexistentes
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      isOffscreenCanvasSupported: false,
      isEvalSupported: false
    });

    this.pdfDoc = await loadingTask.promise;
    this.totalPages = this.pdfDoc.numPages;

    // Obter primeira página para estabelecer a proporção inicial
    const firstPage = await this.pdfDoc.getPage(1);
    this.baseViewport = firstPage.getViewport({ scale: 1.0 });

    this._calculateScale();
    this._createPagePlaceholders();
    this._setupIntersectionObserver();

    // Renderiza IMEDIATAMENTE a página 1 e as seguintes sem depender exclusivamente do observer
    this._renderPage(1);
    if (this.totalPages >= 2) this._renderPage(2);
    if (this.totalPages >= 3) this._renderPage(3);

    // Carregar Sumário se existir
    this._loadOutline();

    // Restaurar rolagem anterior se houver
    if (initialRatio > 0) {
      setTimeout(() => {
        this.setScrollRatio(initialRatio);
        this._checkVisiblePages();
      }, 200);
    }

    this.onPageChange(this.currentPage, this.totalPages, this.getScrollRatio());
    return this.totalPages;
  }

  _calculateScale() {
    const containerW = this.container.clientWidth || window.innerWidth;
    const targetCssWidth = Math.min(760, Math.max(280, containerW - 24));
    const baseW = (this.baseViewport && this.baseViewport.width > 0) ? this.baseViewport.width : 595.28;
    this.scale = (targetCssWidth / baseW) * this.zoomMultiplier;
  }

  _createPagePlaceholders() {
    this.pagesWrapper = document.createElement('div');
    this.pagesWrapper.className = 'pdf-pages-wrapper';
    this.container.appendChild(this.pagesWrapper);

    const containerW = this.container.clientWidth || window.innerWidth;
    const targetCssWidth = Math.min(760, Math.max(280, containerW - 24));
    const baseW = (this.baseViewport && this.baseViewport.width > 0) ? this.baseViewport.width : 595.28;
    const baseH = (this.baseViewport && this.baseViewport.height > 0) ? this.baseViewport.height : 841.89;
    const cssScale = (targetCssWidth / baseW) * this.zoomMultiplier;

    const width = Math.floor(baseW * cssScale);
    const height = Math.floor(baseH * cssScale);

    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      const pageEl = document.createElement('div');
      pageEl.className = 'page-container';
      pageEl.dataset.pageNumber = pageNum;
      pageEl.style.width = `${width}px`;
      pageEl.style.height = `${height}px`;
      pageEl.style.minHeight = `${height}px`;
      pageEl.style.flexShrink = '0';

      // Placeholder de carregamento
      const placeholder = document.createElement('div');
      placeholder.className = 'page-loading-placeholder';
      placeholder.innerText = window.i18n ? window.i18n.t('page_label', { page: pageNum }) : `Página ${pageNum}`;
      pageEl.appendChild(placeholder);

      // Camada de Destaques
      const hlLayer = document.createElement('div');
      hlLayer.className = 'highlight-layer';
      pageEl.appendChild(hlLayer);

      // Canvas para Traço Livre (Freehand Ink)
      const inkCanvas = document.createElement('canvas');
      inkCanvas.className = 'ink-canvas';
      inkCanvas.width = width;
      inkCanvas.height = height;
      pageEl.appendChild(inkCanvas);

      this.pagesWrapper.appendChild(pageEl);
      this.pageContainers.push(pageEl);
    }
  }

  _setupIntersectionObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.dataset.pageNumber, 10);
          this._renderPage(pageNum);
        }
      });
    }, {
      root: this.container,
      rootMargin: '1000px 0px 1000px 0px', // Pre-renderiza páginas próximas para rolagem ultra fluida
      threshold: 0.01
    });

    this.pageContainers.forEach((pageEl) => this.observer.observe(pageEl));
  }

  async _renderPage(pageNum) {
    if (pageNum < 1 || pageNum > this.totalPages) return;
    if (this.renderedPages.has(pageNum) || this.renderingPages.has(pageNum)) {
      return;
    }

    this.renderingPages.add(pageNum);
    const pageEl = this.pageContainers[pageNum - 1];
    if (!pageEl) {
      this.renderingPages.delete(pageNum);
      return;
    }

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const unscaledVp = page.getViewport({ scale: 1.0 });

      const containerW = this.container.clientWidth || window.innerWidth;
      const targetCssWidth = Math.min(760, Math.max(280, containerW - 24));
      const pageW = unscaledVp.width || 595.28;
      const pageH = unscaledVp.height || 841.89;
      const cssScale = (targetCssWidth / pageW) * this.zoomMultiplier;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      const widthPx = Math.floor(pageW * cssScale);
      const heightPx = Math.floor(pageH * cssScale);

      pageEl.style.width = `${widthPx}px`;
      pageEl.style.height = `${heightPx}px`;
      pageEl.style.minHeight = `${heightPx}px`;
      pageEl.style.flexShrink = '0';

      const inkCanvas = pageEl.querySelector('.ink-canvas');
      if (inkCanvas) {
        inkCanvas.width = widthPx;
        inkCanvas.height = heightPx;
        inkCanvas.style.width = `${widthPx}px`;
        inkCanvas.style.height = `${heightPx}px`;
      }

      // Canvas principal da página renderizado em alta definição (HiDPI / Retina)
      let canvas = pageEl.querySelector('.page-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'page-canvas';
        pageEl.insertBefore(canvas, pageEl.firstChild);
      }

      const renderViewport = page.getViewport({ scale: cssScale * dpr });

      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      canvas.style.width = `${widthPx}px`;
      canvas.style.height = `${heightPx}px`;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: renderViewport,
        annotationMode: 2
      };

      await page.render(renderContext).promise;

      // Sucesso na renderização gráfica: remove placeholder imediatamente
      const placeholder = pageEl.querySelector('.page-loading-placeholder');
      if (placeholder) placeholder.remove();

      this.renderedPages.add(pageNum);
      this.renderingPages.delete(pageNum);

      // Renderizar Camada de Texto para Seleção e Busca de forma segura
      try {
        const textViewport = page.getViewport({ scale: cssScale });
        await this._renderTextLayer(page, textViewport, pageEl);
      } catch (textErr) {
        console.warn(`[Curió-PDF] Aviso ao renderizar textLayer na página ${pageNum}:`, textErr);
      }

      // Notificar que a página está pronta para carregar destaques associados
      if (this.options.onPageRendered) {
        this.options.onPageRendered(pageNum, pageEl, page.getViewport({ scale: cssScale }));
      }
    } catch (err) {
      console.error(`Erro ao renderizar página ${pageNum}: ${err.message}\n${err.stack || ''}`);
      this.renderingPages.delete(pageNum);
    }
  }

  async _renderTextLayer(page, viewport, pageEl) {
    let textLayerDiv = pageEl.querySelector('.textLayer');
    if (textLayerDiv) {
      textLayerDiv.innerHTML = '';
    } else {
      textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      // Inserir antes da camada de destaque para permitir sobreposição de cor
      pageEl.insertBefore(textLayerDiv, pageEl.querySelector('.highlight-layer'));
    }

    textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
    textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;
    textLayerDiv.style.setProperty('--scale-factor', viewport.scale);

    const textContent = await page.getTextContent();
    await pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: viewport,
      textDivs: []
    }).promise;
  }

  async _loadOutline() {
    try {
      const outline = await this.pdfDoc.getOutline();
      if (!outline || outline.length === 0) {
        this.onOutlineLoaded([]);
        return;
      }

      const parsedOutline = [];
      for (const item of outline) {
        let pageNumber = 1;
        if (typeof item.dest === 'string') {
          const dest = await this.pdfDoc.getDestination(item.dest);
          if (dest) {
            const pageIndex = await this.pdfDoc.getPageIndex(dest[0]);
            pageNumber = pageIndex + 1;
          }
        } else if (Array.isArray(item.dest) && item.dest.length > 0) {
          const pageIndex = await this.pdfDoc.getPageIndex(item.dest[0]);
          pageNumber = pageIndex + 1;
        }

        parsedOutline.push({
          title: item.title,
          pageNumber: pageNumber
        });
      }

      this.onOutlineLoaded(parsedOutline);
    } catch (e) {
      console.warn('Documento não possui sumário estruturado:', e);
      this.onOutlineLoaded([]);
    }
  }

  scrollToPage(pageNum) {
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      const pageEl = this.pageContainers[pageNum - 1];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.currentPage = pageNum;
        this.onPageChange(this.currentPage, this.totalPages, this.getScrollRatio());
      }
    }
  }

  setZoom(delta) {
    const newZoom = Math.min(Math.max(this.zoomMultiplier + delta, 0.6), 2.5);
    if (Math.abs(newZoom - this.zoomMultiplier) > 0.05) {
      this.zoomMultiplier = newZoom;
      this._calculateScale();
      this._rebuildLayout();
    }
  }

  setZoomTo(targetZoom) {
    const newZoom = Math.min(Math.max(targetZoom, 0.6), 2.5);
    if (Math.abs(newZoom - this.zoomMultiplier) > 0.05) {
      this.zoomMultiplier = newZoom;
      this._calculateScale();
      this._rebuildLayout();
    }
  }

  fitToWidth() {
    this.zoomMultiplier = 1.0;
    this._calculateScale();
    this._rebuildLayout();
  }

  _rebuildLayout() {
    const currentRatio = this.getScrollRatio();
    this.renderedPages.clear();
    this.renderingPages.clear();
    this.container.innerHTML = '';
    this.pageContainers = [];

    this._createPagePlaceholders();
    this._setupIntersectionObserver();
    this._renderPage(this.currentPage || 1);
    this._checkVisiblePages();
    setTimeout(() => {
      this.setScrollRatio(currentRatio);
      this._checkVisiblePages();
    }, 100);
  }

  // Busca textual no documento
  async search(query) {
    this.searchTerm = query ? query.trim().toLowerCase() : '';
    this.searchResults = [];
    this.currentSearchIndex = -1;

    if (!this.searchTerm || !this.pdfDoc) {
      return { total: 0, current: 0 };
    }

    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      const page = await this.pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ').toLowerCase();

      let startIndex = 0;
      while ((startIndex = pageText.indexOf(this.searchTerm, startIndex)) !== -1) {
        this.searchResults.push({
          pageNumber: pageNum,
          charIndex: startIndex
        });
        startIndex += this.searchTerm.length;
      }
    }

    if (this.searchResults.length > 0) {
      this.currentSearchIndex = 0;
      this.scrollToPage(this.searchResults[0].pageNumber);
    }

    return {
      total: this.searchResults.length,
      current: this.searchResults.length > 0 ? this.currentSearchIndex + 1 : 0
    };
  }

  nextSearchResult() {
    if (this.searchResults.length === 0) return { total: 0, current: 0 };
    this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchResults.length;
    const match = this.searchResults[this.currentSearchIndex];
    this.scrollToPage(match.pageNumber);
    return {
      total: this.searchResults.length,
      current: this.currentSearchIndex + 1
    };
  }

  prevSearchResult() {
    if (this.searchResults.length === 0) return { total: 0, current: 0 };
    this.currentSearchIndex = (this.currentSearchIndex - 1 + this.searchResults.length) % this.searchResults.length;
    const match = this.searchResults[this.currentSearchIndex];
    this.scrollToPage(match.pageNumber);
    return {
      total: this.searchResults.length,
      current: this.currentSearchIndex + 1
    };
  }
}

window.PdfViewer = PdfViewer;
