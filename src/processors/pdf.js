import fs from 'node:fs';
import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import { buildDuplexOrder, isEvenIndexZeroBased } from '../utils/reorder.js';

export async function processPdfFile({ inputPath, outputPath, flipMode = 'none', autoOrient = false, forceA4 = true, logger }) {
  const data = await fs.promises.readFile(inputPath);
  const srcDoc = await PDFDocument.load(data, { ignoreEncryption: false });
  const pageCount = srcDoc.getPageCount();
  logger.info(`Pages: ${pageCount}`);

  const outDoc = await PDFDocument.create();
  const order = buildDuplexOrder(pageCount);

  for (const idx of order) {
    const [copied] = await outDoc.copyPages(srcDoc, [idx]);
    const srcPage = srcDoc.getPage(idx);

    // Orientation adjustments
    if (autoOrient) {
      const { width, height } = srcPage.getSize();
      if (width > height) {
        copied.setRotation((copied.getRotation() || 0) + 90);
      }
    }

    // Flip even pages for short-edge
    if (isEvenIndexZeroBased(idx)) {
        console.error('~~~ before',copied.getRotation())
      copied.setRotation(degrees((copied.getRotation().angle || 0) + 180));
      console.error('~~~ after')
      
    }

    if (forceA4) {
      const [a4w, a4h] = PageSizes.A4;
      // Attempt to embed page to scale into A4; fallback to resize
      try {
        const embedded = await outDoc.embedPage(srcPage);
        const newPage = outDoc.addPage([a4w, a4h]);
        // Compute scale to fit within A4 with margins
        const margin = 18; // ~0.25 inch
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

        // Apply rotations to the new page equivalent to copied
        const rot = copied.getRotation() || 0;
        if (rot) newPage.setRotation(rot);
      } catch {
        // Fallback: add copied page and set size to A4 (may not scale content)
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

