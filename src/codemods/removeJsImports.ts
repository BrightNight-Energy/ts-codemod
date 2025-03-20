import type { Project } from 'ts-morph';

export function removeJsImports(project: Project, filePath: string) {
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
