import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';
const serverDir = __dirname;

if (isDev) {
  console.log('Building NestJS server...');
  execSync('npx nest build', { cwd: serverDir, stdio: 'inherit' });
}

const mainPath = path.join(serverDir, 'dist', 'main.js');

console.log('Starting NestJS application...');

const { createRequire } = await import('module');
const require = createRequire(import.meta.url);
require(mainPath);
