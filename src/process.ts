import type { Project } from 'ts-morph';
import path from 'node:path';
import fs from 'node:fs';

function convertImportsToJs(project: Project, filePath: string) {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) return;

  sourceFile.getImportDeclarations().forEach((importDeclaration) => {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

    if (
      moduleSpecifier.startsWith('.') &&
      !moduleSpecifier.endsWith('.js') &&
      !moduleSpecifier.includes('.svg')
    ) {
      const updatedSpecifier = `${moduleSpecifier}.js`;
      importDeclaration.setModuleSpecifier(updatedSpecifier);
    }
  });
  // biome-ignore lint/suspicious/noConsole: ok here
  console.log(' ✏️ save', sourceFile.getFilePath().toString());
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
