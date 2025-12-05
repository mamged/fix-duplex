import fs from 'node:fs';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { buildDuplexOrder, isEvenIndexZeroBased } from '../utils/reorder.js';

export async function processPdfBuffer({ buffer, outputPath, flipMode = 'none', autoOrient = false, forceA4 = true, logger }) {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  const pageCount = srcDoc.getPageCount();
  logger.info(`Pages: ${pageCount}`);

  const outDoc = await PDFDocument.create();
  const order = buildDuplexOrder(pageCount);

  for (const idx of order) {
    const [copied] = await outDoc.copyPages(srcDoc, [idx]);
    const srcPage = srcDoc.getPage(idx);

    if (autoOrient) {
      const { width, height } = srcPage.getSize();
      if (width > height) {
        copied.setRotation((copied.getRotation() || 0) + 90);
      }
    }

    if (flipMode === 'short-edge' && isEvenIndexZeroBased(idx)) {
      copied.setRotation((copied.getRotation() || 0) + 180);
    }

    if (forceA4) {
      const [a4w, a4h] = PageSizes.A4;
      try {
        const embedded = await outDoc.embedPage(srcPage);
        const newPage = outDoc.addPage([a4w, a4h]);
        const margin = 18;
        const targetW = a4w - margin * 2;
        const targetH = a4h - margin * 2;
        const sWidth = srcPage.getWidth();
        const sHeight = srcPage.getHeight();
        const scale = Math.min(targetW / sWidth, targetH / sHeight);
        const drawW = sWidth * scale;
        const drawH = sHeight * scale;
        const x = (a4w - drawW) / 2;
        const y = (a4h - drawH) / 2;
        newPage.drawPage(embedded, { x, y, width: drawW, height: drawH });
        const rot = copied.getRotation() || 0;
        if (rot) newPage.setRotation(rot);
      } catch {
        copied.setSize(...PageSizes.A4);
        outDoc.addPage(copied);
      }
    } else {
      outDoc.addPage(copied);
    }
  }

  const pdfBytes = await outDoc.save();
  await fs.promises.writeFile(outputPath, pdfBytes);
}

