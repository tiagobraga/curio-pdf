/**
 * i18n.js - Sistema de Internacionalização (Português, Espanhol, Inglês)
 */

(function() {
  const translations = {
    pt: {
      app_name: "Curió PDF",
      app_tagline: "Leitor de PDF minimalista.",
      open_pdf: "Abrir Documento PDF",
      recent_docs: "Documentos Recentes",
      no_recent: "Nenhum documento recente.",
      search_placeholder: "Buscar palavras...",
      text_mode: "Texto",
      ink_mode: "Caneta",
      outline_tab: "Sumário",
      highlights_tab: "Destaques",
      navigation: "Navegação",
      btn_outline: "Sumário",
      btn_highlight: "Grifar",
      btn_fit: "Ajustar",
      btn_zoom_in: "Aumentar Zoom",
      btn_zoom_out: "Reduzir Zoom",
      btn_save: "Salvar",
      btn_about: "Sobre",
      about_title: "Sobre o Curió PDF",
      close_btn: "Fechar",
      page_indicator: "Pág. {current} de {total}",
      page_label: "Página {page}",
      loading_doc: "Carregando documento...",
      night_mode_on: "Modo Noturno ativado",
      night_mode_off: "Modo Claro ativado",
      highlighter_on: "Marca-texto ativado: selecione o texto para grifar",
      mode_text_msg: "Modo: Selecionar texto",
      mode_ink_msg: "Modo: Caneta livre com o dedo",
      fit_screen_msg: "Visualização ajustada à tela",
      saving_doc: "Gravando anotações no PDF...",
      choose_save_location: "Escolha onde salvar no Content Hub",
      doc_removed: "Documento removido dos recentes",
      no_outline: "Nenhum sumário estruturado encontrado no documento.",
      no_highlights: "Nenhum destaque salvo neste PDF.",
      error_open: "Erro ao abrir documento: ",
      remove_recent_title: "Remover dos recentes",
      prev_btn: "Anterior",
      next_btn: "Próximo",
      close_search: "Fechar busca",
      back_title: "Voltar aos Recentes",
      theme_title: "Modo Noturno",
      search_title: "Buscar no texto",
      original_not_found: "Arquivo original não encontrado. Abra pelo botão principal."
    },
    es: {
      app_name: "Curió PDF",
      app_tagline: "Lector de PDF minimalista.",
      open_pdf: "Abrir documento PDF",
      recent_docs: "Documentos recientes",
      no_recent: "No hay documentos recientes.",
      search_placeholder: "Buscar palabras...",
      text_mode: "Texto",
      ink_mode: "Pluma",
      outline_tab: "Índice",
      highlights_tab: "Destacados",
      navigation: "Navegación",
      btn_outline: "Índice",
      btn_highlight: "Resaltar",
      btn_fit: "Ajustar",
      btn_zoom_in: "Aumentar zoom",
      btn_zoom_out: "Reducir zoom",
      btn_save: "Guardar",
      btn_about: "Acerca de",
      about_title: "Acerca de Curió PDF",
      close_btn: "Cerrar",
      page_indicator: "Pág. {current} de {total}",
      page_label: "Página {page}",
      loading_doc: "Cargando documento...",
      night_mode_on: "Modo nocturno activado",
      night_mode_off: "Modo claro activado",
      highlighter_on: "Resaltador activado: seleccione texto para resaltar",
      mode_text_msg: "Modo: Seleccionar texto",
      mode_ink_msg: "Modo: Pluma libre con el dedo",
      fit_screen_msg: "Vista ajustada a la pantalla",
      saving_doc: "Guardando anotaciones en el PDF...",
      choose_save_location: "Elija dónde guardar en Content Hub",
      doc_removed: "Documento eliminado de recientes",
      no_outline: "No se encontró ningún índice en el documento.",
      no_highlights: "No hay destacados guardados en este PDF.",
      error_open: "Error al abrir documento: ",
      remove_recent_title: "Eliminar de recientes",
      prev_btn: "Anterior",
      next_btn: "Siguiente",
      close_search: "Cerrar búsqueda",
      back_title: "Volver a Recientes",
      theme_title: "Modo Nocturno",
      search_title: "Buscar en el texto",
      original_not_found: "Archivo original no encontrado. Ábralo desde el botón principal."
    },
    en: {
      app_name: "Curió PDF",
      app_tagline: "Minimalist PDF reader.",
      open_pdf: "Open PDF Document",
      recent_docs: "Recent Documents",
      no_recent: "No recent documents.",
      search_placeholder: "Search words...",
      text_mode: "Text",
      ink_mode: "Pen",
      outline_tab: "Outline",
      highlights_tab: "Highlights",
      navigation: "Navigation",
      btn_outline: "Outline",
      btn_highlight: "Highlight",
      btn_fit: "Fit",
      btn_zoom_in: "Zoom In",
      btn_zoom_out: "Zoom Out",
      btn_save: "Save",
      btn_about: "About",
      about_title: "About Curió PDF",
      close_btn: "Close",
      page_indicator: "Page {current} of {total}",
      page_label: "Page {page}",
      loading_doc: "Loading document...",
      night_mode_on: "Dark mode enabled",
      night_mode_off: "Light mode enabled",
      highlighter_on: "Highlighter active: select text to highlight",
      mode_text_msg: "Mode: Select text",
      mode_ink_msg: "Mode: Freehand pen",
      fit_screen_msg: "View adjusted to screen",
      saving_doc: "Saving annotations in PDF...",
      choose_save_location: "Choose where to save in Content Hub",
      doc_removed: "Document removed from recents",
      no_outline: "No structured outline found in document.",
      no_highlights: "No highlights saved in this PDF.",
      error_open: "Error opening document: ",
      remove_recent_title: "Remove from recents",
      prev_btn: "Previous",
      next_btn: "Next",
      close_search: "Close search",
      back_title: "Back to Recents",
      theme_title: "Dark Mode",
      search_title: "Search in text",
      original_not_found: "Original file not found. Open using the main button."
    }
  };

  function detectLanguage() {
    var raw = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    raw = raw.toLowerCase();
    if (raw.indexOf('pt') === 0) return 'pt';
    if (raw.indexOf('es') === 0) return 'es';
    return 'en'; // fallback universal
  }

  const currentLang = detectLanguage();
  const currentDict = translations[currentLang] || translations.en;

  function t(key, params) {
    var str = currentDict[key] || translations.en[key] || key;
    if (params) {
      for (var p in params) {
        str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
      }
    }
    return str;
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (key) {
        el.innerText = t(key);
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', t(key));
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', t(key));
      }
    });
  }

  window.i18n = {
    lang: currentLang,
    t: t,
    applyTranslations: applyTranslations
  };
})();
