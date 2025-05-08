import type { Callback } from '../types.js';

export const mergeDuplicateImports: Callback = (project, filePath) => {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    console.error(`File not found in ts-morph project: ${filePath}`);
    return { fileCount: 0 };
  }

  let modifiedCount = 0;
  const importMap = new Map<
    string,
    {
      defaultImport?: string;
      namedImports: Set<string>;
      namespaceImport?: string;
    }
  >(); // Maps module specifiers to default, named, and namespace imports

  // Collect all imports from the file
  const importDeclarations = sourceFile.getImportDeclarations();

  importDeclarations.forEach((importDecl) => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    if (!importMap.has(moduleSpecifier)) {
      importMap.set(moduleSpecifier, {
        defaultImport: undefined,
        namedImports: new Set(),
        namespaceImport: undefined,
      });
    }

    const entry = importMap.get(moduleSpecifier);

    // Handle default import
    const defaultImport = importDecl.getDefaultImport();
    if (entry && defaultImport && !entry.defaultImport) {
      entry.defaultImport = defaultImport.getText(); // Store the default import only if not set
    }

    // Handle named imports
    const namedImports = importDecl.getNamedImports();
    namedImports.forEach((namedImport) => {
      const importText = namedImport.getText();
      if (entry) {
        entry.namedImports.add(importText);
      }
    });

    // Handle namespace imports (e.g., import * as yup from 'yup')
    const namespaceImport = importDecl.getNamespaceImport();
    if (entry && namespaceImport) {
      entry.namespaceImport = namespaceImport.getText();
    }

    // Remove original import
    importDecl.remove();
    modifiedCount += 1;
  });

  // Reconstruct the merged imports
  importMap.forEach(({ defaultImport, namedImports, namespaceImport }, moduleSpecifier) => {
    const namedImportArray = Array.from(namedImports).map((name) => ({ name }));

    if (namespaceImport) {
      // If there is a namespace import, keep it in a separate import declaration
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namespaceImport,
      });
    }

    if (defaultImport || namedImportArray.length > 0) {
      // Create a separate import for default and named imports
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        defaultImport,
        namedImports: namedImportArray.length ? namedImportArray : undefined,
      });
    }
  });

  if (modifiedCount) {
    console.log('  ✏', sourceFile.getFilePath());
    sourceFile.saveSync();
    return {
      fileCount: 1,
      transformed: [{ name: 'duplicateImportsMerged', count: modifiedCount }],
    };
  }

  return { fileCount: 0 };
};
