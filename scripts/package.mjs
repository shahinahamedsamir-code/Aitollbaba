/**
 * Builds the static export and packs it into aitoollbaba-site.zip, ready to
 * upload and extract into a host's public folder.
 *
 * Written as a Node script rather than an npm one-liner because the file list
 * has to be expanded explicitly: `tar -C out .` prefixes every entry with
 * "./", and shell globbing behaves differently on Windows.
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'out');
const zipPath = path.join(root, 'aitoollbaba-site.zip');

console.log('building static export…');
// A single command string rather than args-plus-shell, which Node deprecates.
execSync('npx next build', { cwd: root, stdio: 'inherit' });

if (!fs.existsSync(outDir)) {
  console.error('out/ was not created — is output: "export" still set in next.config.mjs?');
  process.exit(1);
}

// Hidden entries matter here: .htaccess carries the routing rules.
const entries = fs.readdirSync(outDir);
if (!entries.includes('.htaccess')) {
  console.error('.htaccess missing from out/ — it should be copied from public/.');
  process.exit(1);
}

fs.rmSync(zipPath, { force: true });
// A relative target on purpose: bsdtar reads "I:\path" as a remote host spec
// ("host:file") and refuses to write it.
execFileSync('tar', ['-a', '-c', '-f', '../aitoollbaba-site.zip', ...entries], {
  cwd: outDir,
  stdio: 'inherit',
});

const mb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
console.log(`\npacked ${entries.length} top-level entries -> aitoollbaba-site.zip (${mb} MB)`);
console.log('upload it to public_html and extract there.');
