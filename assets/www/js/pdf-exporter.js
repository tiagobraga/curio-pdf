/**
 * pdf-exporter.js - Exportador e Gravador de Destaques diretamente no binário do PDF
 */

class PdfExporter {
  static hexToRgb(hex) {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255
    };
  }

  static async exportAnnotatedPdf(originalArrayBuffer, highlights, fileName = 'documento_anotado.pdf') {
    if (!window.PDFLib) {
      throw new Error('Biblioteca PDFLib não encontrada!');
    }

    const { PDFDocument, rgb, degrees } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(originalArrayBuffer);
    const pages = pdfDoc.getPages();

    highlights.forEach(hl => {
      const pageIndex = hl.pageNumber - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) return;

      const page = pages[pageIndex];
      const { width, height } = page.getSize();
      const rgbColor = PdfExporter.hexToRgb(hl.color);
      const pdfRgb = rgb(rgbColor.r, rgbColor.g, rgbColor.b);

      if (hl.type === 'text' && hl.rects) {
        hl.rects.forEach(r => {
          // No padrão PDF, a origem (0, 0) é no canto inferior esquerdo
          const pdfX = r.x * width;
          const pdfY = height - (r.y * height) - (r.h * height);
          const pdfW = r.w * width;
          const pdfH = r.h * height;

          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: pdfRgb,
            opacity: 0.42
          });
        });
      } else if (hl.type === 'ink' && hl.path && hl.path.length > 1) {
        for (let i = 0; i < hl.path.length - 1; i++) {
          const p1 = hl.path[i];
          const p2 = hl.path[i + 1];

          const startX = p1.x * width;
          const startY = height - (p1.y * height);
          const endX = p2.x * width;
          const endY = height - (p2.y * height);

          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            thickness: 8,
            color: pdfRgb,
            opacity: 0.42
          });
        }
      }
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  static downloadPdfBytes(pdfBytes, fileName) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.pdf$/i, '') + '_destacado.pdf';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

window.PdfExporter = PdfExporter;
