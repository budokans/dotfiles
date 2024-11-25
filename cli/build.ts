import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get the directory name in an ESM-compatible way
const __dirname = dirname(fileURLToPath(import.meta.url));

const buildOptions: esbuild.BuildOptions = {
  entryPoints: [join(__dirname, 'src', 'init.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: join(__dirname, 'dist', 'init.js'),
  minify: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
};

try {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');

  if (watch) {
    // Watch mode
    const context = await esbuild.context(buildOptions);
    await context.watch();
    console.log('Watching for changes...');
  } else {
    // Single build
    await esbuild.build(buildOptions);
    console.log('Build complete');
  }
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
