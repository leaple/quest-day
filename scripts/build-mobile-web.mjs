// Bundle the current static QUEST DAY PWA into Capacitor's www directory.
import { cp, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = join(root, 'www');
const checkOnly = process.argv.includes('--check');
const rootFiles = await readdir(root);
const sources = [
  'index.html', 'manifest.webmanifest', 'sw.js', 'hero-preview.html', 'account-deletion.html', 'privacy.html',
  ...rootFiles.filter(name => /^(?:upgrade-[\w.-]+|hero-portraits|codex-[\w.-]+|realtime-config|account-deletion)\.js$/.test(name)),
  ...rootFiles.filter(name => /^(?:characters-[\w.-]+|character-art-direction-[\w.-]+)\.json$/.test(name)),
  ...rootFiles.filter(name => /^icon-\d+\.png$/.test(name))
];
if (!checkOnly) {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
}
for (const file of sources) {
  await stat(join(root, file));
  if (!checkOnly) await cp(join(root, file), join(out, file));
}
await stat(join(root, 'art'));
if (!checkOnly) await cp(join(root, 'art'), join(out, 'art'), { recursive: true });
const index = await readFile(join(root, 'index.html'), 'utf8');
const refs = [...index.matchAll(/<script\b[^>]*\bsrc=["']\.\/([^"']+)["']/g)]
  .map(match => match[1].split('?')[0]);
const missing = refs.filter(file => !sources.includes(file));
if (missing.length) {
  console.error('Missing referenced scripts:', missing.join(', '));
  process.exitCode = 1;
} else {
  console.log((checkOnly ? 'Validated' : 'Created mobile www/ bundle:') + ' ' +
    sources.length + ' root files, 1 art directory, ' + refs.length + ' JS references.');
}
