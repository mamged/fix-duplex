import fs from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import { processPdfBuffer } from './pdfBuffer.js';

// Convert DOCX -> HTML -> PDF (A4), then reorder using the same pipeline as PDFs
export async function processDocxFile({ inputPath, outputPath, flipMode = 'none', autoOrient = false, forceA4 = true, logger, browser }) {
  const docxBuffer = await fs.promises.readFile(inputPath);
  logger.info('Converting DOCX to HTML');
  const { value: html, messages } = await mammoth.convertToHtml({ buffer: docxBuffer });
  if (messages?.length) {
    messages.forEach(m => logger.debug(`mammoth: ${m.type} - ${m.message}`));
  }

  // Minimal HTML wrapper to improve print fidelity
  const htmlDoc = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, Helvetica, sans-serif; }
      </style>
    </head>
    <body>${html}</body>
  </html>`;

  const reuseBrowser = browser || await puppeteer.launch({ headless: 'new' });
  const page = await reuseBrowser.newPage();
  await page.setContent(htmlDoc, { waitUntil: 'networkidle0' });
  logger.info('Rendering HTML to PDF (A4)');
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await page.close();

  // Reorder the PDF and write output
  await processPdfBuffer({ buffer: pdfBuffer, outputPath, flipMode, autoOrient, forceA4, logger });
  return reuseBrowser;
}

