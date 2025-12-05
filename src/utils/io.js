import fs from 'node:fs';
import path from 'node:path';

export async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

export async function uniqueOutputPath(desiredPath) {
  const dir = path.dirname(desiredPath);
  const base = path.basename(desiredPath, '.pdf');
  let candidate = desiredPath;
  let i = 1;
  while (true) {
    try {
      await fs.promises.access(candidate);
      candidate = path.join(dir, `${base} (${i++}).pdf`);
    } catch {
      return candidate;
    }
  }
}

