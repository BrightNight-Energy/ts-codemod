import fs from 'node:fs';
import path from 'node:path';
import type { Project } from 'ts-morph';

function convertImportsToJs(project: Project, filePath: string) {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    // biome-ignore lint/suspicious/noConsole: ok here
    console.error(`File not found in ts-morph project: ${filePath}`);
    return;
  }

  sourceFile.getImportDeclarations().forEach((importDeclaration) => {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

    if (!moduleSpecifier.startsWith('.') || moduleSpecifier.includes('.svg')) {
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
  console.log('  ✏️', sourceFile.getFilePath().toString());
  sourceFile.saveSync();
}

export function processTarget(project: Project, target: string, initCount = 0) {
  let count = initCount;
  if (fs.statSync(target).isDirectory()) {
    const files = fs.readdirSync(target);
    for (const file of files) {
      const fullPath = path.join(target, file);
      if (fs.statSync(fullPath).isDirectory()) {
        processTarget(project, fullPath, count);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        convertImportsToJs(project, fullPath);
        count += 1;
      }
    }
  } else if (target.endsWith('.ts') || target.endsWith('.tsx')) {
    convertImportsToJs(project, target);
    count += 1;
  }
  return count;
}
