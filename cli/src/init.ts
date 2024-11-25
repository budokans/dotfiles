import { execSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type CopyOptions = {
  readonly excludeDirs: readonly string[];
};

type TemplateConfig = {
  readonly templateDir: string;
  readonly targetDir: string;
  readonly tempDir: string | null;
};

const getDirectoryContents = (dir: string): readonly string[] =>
  readdirSync(dir);

const shouldCopyFile = (file: string, options: CopyOptions): boolean =>
  !options.excludeDirs.includes(file);

const copyFile = (
  srcPath: string,
  destPath: string,
  options: CopyOptions
): void => {
  if (statSync(srcPath).isDirectory()) {
    mkdirSync(destPath, { recursive: true });
    copyDirectoryContents(srcPath, destPath, options);
  } else {
    copyFileSync(srcPath, destPath);
  }
};

const copyDirectoryContents = (
  src: string,
  dest: string,
  options: CopyOptions
): void => {
  getDirectoryContents(src)
    .filter((file) => shouldCopyFile(file, options))
    .forEach((file) => {
      const srcPath = join(src, file);
      const destPath = join(dest, file);
      copyFile(srcPath, destPath, options);
    });
};

const getTemplateConfig = (isLocalTesting: boolean): TemplateConfig => {
  if (isLocalTesting) {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    return {
      templateDir: join(scriptDir, '../../typescript-starter'),
      targetDir: process.cwd(),
      tempDir: null,
    };
  }

  const tempDir = join(process.cwd(), '.temp-starter');
  return {
    templateDir: join(
      tempDir,
      'node_modules/@budokans/typescript-react-starter'
    ),
    targetDir: process.cwd(),
    tempDir,
  };
};

const downloadTemplate = (tempDir: string): void => {
  mkdirSync(tempDir, { recursive: true });
  console.log('📦 Downloading template...');
  execSync(
    'pnpm add @budokans/typescript-react-starter --prefix .temp-starter',
    {
      stdio: 'inherit',
    }
  );
};

const cleanup = (tempDir: string): void => {
  rmSync(tempDir, { recursive: true, force: true });
};

const installDependencies = (): void => {
  console.log('📥 Installing dependencies...');
  execSync('pnpm install', { stdio: 'inherit' });
};

const copyTemplate = (config: TemplateConfig): void => {
  console.log('📋 Copying template files...');
  copyDirectoryContents(config.templateDir, config.targetDir, {
    excludeDirs: ['node_modules', '.git', 'dist', '.temp-starter'],
  });
};

const init = async (): Promise<void> => {
  const isLocalTesting = process.argv.includes('--local');
  const config = getTemplateConfig(isLocalTesting);

  try {
    if (config.tempDir) {
      downloadTemplate(config.tempDir);
    }

    copyTemplate(config);

    if (config.tempDir) {
      cleanup(config.tempDir);
    }

    installDependencies();
    console.log('\n✨ TypeScript React project initialised successfully!');
  } catch (error) {
    if (config.tempDir) {
      cleanup(config.tempDir);
    }
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
};

void init();
