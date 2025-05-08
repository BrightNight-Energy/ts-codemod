import type { Callback } from '../types.js';

export const removeJsImports: Callback = (project, filePath) => {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    console.error(`File not found in ts-morph project: ${filePath}`);
    return { fileCount: 0 };
  }

  let modifiedCount = 0;

  sourceFile.getImportDeclarations().forEach((importDecl) => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    // If the import ends with .js, remove the extension
    if (moduleSpecifier.startsWith('.') && moduleSpecifier.endsWith('.js')) {
      importDecl.setModuleSpecifier(moduleSpecifier.replace(/\.js$/, ''));
      modifiedCount += 1;
    }
  });

  // Save the file only if changes were made
  if (modifiedCount) {
    console.log('  ✏', sourceFile.getFilePath().toString());
    sourceFile.saveSync();
    return { fileCount: 1, transformed: [{ name: 'removeJsImports', count: modifiedCount }] };
  }

  return { fileCount: 0 };
};
