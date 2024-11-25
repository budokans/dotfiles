import { execSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

type CopyOptions = {
  readonly excludeDirs: readonly string[];
};

const copyFiles = (src: string, dest: string, options: CopyOptions): void => {
  const files = readdirSync(src);

  files.forEach((file) => {
    if (options.excludeDirs.includes(file)) {
      return;
    }

    const srcPath = join(src, file);
    const destPath = join(dest, file);

    if (statSync(srcPath).isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyFiles(srcPath, destPath, options);
    } else {
      copyFileSync(srcPath, destPath);
    }
  });
};

const init = async (): Promise<void> => {
  const tempDir = join(process.cwd(), '.temp-starter');

  try {
    // For local testing, use the local files
    const isDev = process.env['NODE_ENV'] === 'development';
    let templateDir: string;

    if (isDev) {
      // Use local files (adjust this path to point to your typescript-starter directory)
      templateDir = join(__dirname, '../../typescript-react-starter');
      console.log('Using local template files from:', templateDir);
    } else {
      // Create and clean temp directory
      mkdirSync(tempDir, { recursive: true });

      console.log('📦 Downloading template...');
      execSync(
        'pnpm add @budokans/typescript-react-starter --prefix .temp-starter',
        {
          stdio: 'inherit',
        }
      );

      templateDir = join(
        tempDir,
        'node_modules/@budokans/typescript-react-starter'
      );
    }

    const targetDir = process.cwd();

    console.log('📋 Copying template files...');
    copyFiles(templateDir, targetDir, {
      excludeDirs: ['node_modules', '.git', 'dist', '.temp-starter'],
    });

    // Cleanup temp directory if it was created
    if (!isDev && tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }

    // Install dependencies
    console.log('📥 Installing dependencies...');
    execSync('pnpm install', { stdio: 'inherit' });

    console.log('\n✨ TypeScript project initialized successfully!');
  } catch (error) {
    // Cleanup on error
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
};

void init();
