import fs from 'node:fs';
import path from 'node:path';
import type { Project } from 'ts-morph';
import type { AllowedTypes } from './types.js';

const ignoredFileExtensions = ['.svg', '.png', '.css'];

function removeJsImports(project: Project, filePath: string) {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    // biome-ignore lint/suspicious/noConsole: ok here
    console.error(`File not found in ts-morph project: ${filePath}`);
    return 0;
  }

  let modified = false;

  sourceFile.getImportDeclarations().forEach((importDecl) => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    // If the import ends with .js, remove the extension
    if (moduleSpecifier.startsWith('.') && moduleSpecifier.endsWith('.js')) {
      importDecl.setModuleSpecifier(moduleSpecifier.replace(/\.js$/, ''));
      modified = true;
    }
  });

  // Save the file only if changes were made
  if (modified) {
    // biome-ignore lint/suspicious/noConsole: ok here
    console.log('  ✏', sourceFile.getFilePath().toString());
    sourceFile.saveSync();
    return 1;
  }

  return 0;
}

function convertImportsToJs(project: Project, filePath: string) {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    // biome-ignore lint/suspicious/noConsole: ok here
    console.error(`File not found in ts-morph project: ${filePath}`);
    return 0;
  }

  sourceFile.getImportDeclarations().forEach((importDeclaration) => {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

    if (
      !moduleSpecifier.startsWith('.') ||
      ignoredFileExtensions.some((ext) => moduleSpecifier.includes(ext))
    ) {
      return;
    }

    if (moduleSpecifier.endsWith('.json')) {
      const importText = importDeclaration.getText();
      const updatedText = importText.replace(
        new RegExp(`(['"])${moduleSpecifier}\\1;?$`), // Match existing import specifier
        `$1${moduleSpecifier}$1 with { type: 'json' };`,
      );
      importDeclaration.replaceWithText(updatedText);
      return;
    }

    if (!moduleSpecifier.endsWith('.js')) {
      const updatedSpecifier = `${moduleSpecifier}.js`;
      importDeclaration.setModuleSpecifier(updatedSpecifier);
    }
  });
  // biome-ignore lint/suspicious/noConsole: ok here
  console.log('  ✏', sourceFile.getFilePath().toString());
  sourceFile.saveSync();

  return 1;
}

function convertMuiIcons(project: Project, filePath: string) {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    // biome-ignore lint/suspicious/noConsole: ok here
    console.error(`File not found in ts-morph project: ${filePath}`);
    return 0;
  }
  let count = 0;

  project.getSourceFiles().forEach((sourceFile) => {
    // Find all import declarations in the file.
    const importDeclarations = sourceFile.getImportDeclarations();

    importDeclarations.forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const regex = /^@mui\/icons-material\/(.+)$/;
      const match = moduleSpecifier.match(regex);
      if (match) {
        const iconName = match[1];

        // Check if there's a default import (e.g. "ClearIcon")
        const defaultImport = importDecl.getDefaultImport();
        if (defaultImport) {
          const localName = defaultImport.getText();

          importDecl.removeDefaultImport();

          // If the imported name and local name are identical, you can omit the alias.
          importDecl.addNamedImport({
            name: iconName ?? '',
            alias: localName !== iconName ? localName : undefined,
          });

          importDecl.setModuleSpecifier('@mui/icons-material');
        }

        sourceFile.saveSync();
        // biome-ignore lint/suspicious/noConsole: ok here
        console.log('  ✏', sourceFile.getFilePath().toString());
        count += 1;
      }
    });
  });

  return count;
}

const callbackMap: Record<AllowedTypes, typeof convertMuiIcons> = {
  '.js': convertImportsToJs,
  'remove-.js': removeJsImports,
  'mui-icons': convertMuiIcons,
};

export function processTarget(
  project: Project,
  target: string,
  type: AllowedTypes = '.js',
  initCount = 0,
) {
  const callback = callbackMap[type];
  let count = initCount;
  if (fs.statSync(target).isDirectory()) {
    const files = fs.readdirSync(target);
    for (const file of files) {
      const fullPath = path.join(target, file);
      if (fs.statSync(fullPath).isDirectory()) {
        count = processTarget(project, fullPath, type, count);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        count += callback(project, fullPath);
      }
    }
  } else if (target.endsWith('.ts') || target.endsWith('.tsx')) {
    count += callback(project, target);
  }
  return count;
}
