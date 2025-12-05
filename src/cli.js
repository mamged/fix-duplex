import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { createLogger } from './utils/logger.js';
import { processPdfFile } from './processors/pdf.js';
import { processDocxFile } from './processors/docx.js';
import { ensureDir, uniqueOutputPath } from './utils/io.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('printer-chef')
  .description('Prepare documents for manual duplex printing on single-sided printers')
  .argument('<files...>', 'One or more input files (.pdf, .docx)')
  .option('-o, --output-dir <dir>', 'Output directory (default: same as input file directory)')
  .option('--flip <mode>', 'Flip mode for even pages: none | long-edge | short-edge', 'none')
  .option('--auto-orient', 'Auto-rotate pages to best orientation for A4', false)
  .option('--force-a4', 'Force output pages to A4 size (scale to fit)', true)
  .option('--log-file <path>', 'Write logs to a file')
  .option('-v, --verbose', 'Verbose logging', false)
  .showHelpAfterError()
  .addHelpText('after', `

Examples:
  $ printer-chef report.pdf
  $ printer-chef doc1.docx doc2.pdf -o out --flip short-edge --auto-orient

Flip modes:
  none       Do not rotate even pages
  long-edge  Suitable when flipping along long edge; usually no rotation needed
  short-edge Rotate even pages by 180° to avoid upside-down backs
`);

async function main() {
  program.parse(process.argv);
  const opts = program.opts();
  const inputFiles = program.args || [];

  const logger = createLogger({ level: opts.verbose ? 'debug' : 'info', filePath: opts.log_file || opts.logFile });

  if (!inputFiles.length) {
    program.help({ error: true });
    return;
  }

  const flipMode = String(opts.flip || 'none').toLowerCase();
  if (!['none', 'long-edge', 'short-edge'].includes(flipMode)) {
    console.error('cant filp')
    logger.error(`Unsupported --flip mode: ${flipMode}`);
    process.exit(2);
  }

  if (opts.outputDir) {
    const specifiedOut = path.resolve(process.cwd(), opts.outputDir);
    await ensureDir(specifiedOut);
    logger.info(`Using specified output directory: ${specifiedOut}`);
  }

  // Reuse a single Puppeteer browser when converting multiple DOCX files
  let sharedBrowser = null;

  let anyFailed = false;

  for (const inputPathRaw of inputFiles) {
    const inputPath = path.resolve(process.cwd(), inputPathRaw);
    const ext = path.extname(inputPath).toLowerCase();
    const baseName = path.basename(inputPath, ext);
    const inputDir = path.dirname(inputPath);
    const outDir = opts.outputDir ? path.resolve(process.cwd(), opts.outputDir) : inputDir;
    const outputPath = await uniqueOutputPath(path.join(outDir, `${baseName}.new.pdf`));

    try {
      // Validate path and readability
      await fs.promises.access(inputPath, fs.constants.R_OK);
    } catch (e) {
      logger.error(`Invalid or unreadable file: ${inputPath}`);
      anyFailed = true;
      console.error('SADSADASDAS~~~~~~~~~~1',e)
      continue;
    }

    logger.info(`Processing: ${inputPath}`);

    try {
      if (ext === '.pdf') {
        await processPdfFile({ inputPath, outputPath, flipMode, autoOrient: !!opts.autoOrient, forceA4: !!opts.forceA4, logger });
      } else if (ext === '.docx') {
        sharedBrowser = await processDocxFile({ inputPath, outputPath, flipMode, autoOrient: !!opts.autoOrient, forceA4: !!opts.forceA4, logger, browser: sharedBrowser });
      } else {
        logger.error(`Unsupported file format: ${ext}. Supported: .pdf, .docx`);
        anyFailed = true;
        console.error('SADSADASDAS~~~~~~~~~~2')
        continue;
      }
      logger.info(chalk.green(`Output: ${outputPath}`));
    } catch (err) {
      anyFailed = true;
      console.error('SADSADASDAS~~~~~~~~~~3', err)
      const msg = err?.message || String(err);
      if (/password|encrypted/i.test(msg)) {
        logger.error(`Cannot process encrypted PDF: ${inputPath}`);
      } else if (/corrupt|invalid/i.test(msg)) {
        logger.error(`Corrupted or invalid document: ${inputPath}`);
      } else if (/EACCES|permission/i.test(msg)) {
        logger.error(`Permission issue while processing: ${inputPath}`);
      } else {
        logger.error(`Failed to process ${inputPath}: ${msg}`);
      }
    }
  }

  if (sharedBrowser) {
    try { await sharedBrowser.close(); } catch {}
  }

  if (anyFailed) {
    logger.warn('Completed with errors. See logs for details.');
    process.exitCode = 1;
  } else {
    logger.info('All files processed successfully.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err?.message || err);
  process.exit(1);
});
