/**
 * Builds the folder that `firebase deploy` uploads as the Cloud Function:
 * compiled code, a production-only package.json and its node_modules.
 * Nothing else goes in, so .env files and key files can never be uploaded.
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const out = join(root, '.deploy');
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' });

run('npx nest build');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
cpSync(join(root, 'dist'), join(out, 'dist'), {
  recursive: true,
  filter: (src) => !src.endsWith('.d.ts') && !src.endsWith('.tsbuildinfo'),
});
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
writeFileSync(
  join(out, 'package.json'),
  JSON.stringify(
    {
      name: 'gym-tracker-api',
      private: true,
      type: 'module',
      main: 'dist/functions.js',
      engines: { node: '24' },
      dependencies: pkg.dependencies,
    },
    null,
    2,
  ) + '\n',
);
run('npm install --omit=dev --no-audit --no-fund --loglevel=error', out);
console.log('Cloud Function package ready in backend/.deploy');
