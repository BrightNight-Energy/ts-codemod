import type { Callback } from '../types.js';

const ignoredFileExtensions = ['.svg', '.png', '.css'];

export const convertImportsToJs: Callback = (project, filePath) => {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    console.error(`File not found in ts-morph project: ${filePath}`);
    return { fileCount: 0 };
  }

  let jsonImportModifiedCount = 0;
  let jsImportModifiedCount = 0;

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
      jsonImportModifiedCount += 1;
      return;
    }

    if (!moduleSpecifier.endsWith('.js')) {
      const updatedSpecifier = `${moduleSpecifier}.js`;
      importDeclaration.setModuleSpecifier(updatedSpecifier);
      jsImportModifiedCount += 1;
    }
  });

  if (jsImportModifiedCount || jsonImportModifiedCount) {
    console.log('  ✏', sourceFile.getFilePath().toString());
    sourceFile.saveSync();
    return {
      fileCount: 1,
      transformed: [
        { name: 'jsImports', count: jsImportModifiedCount },
        { name: 'jsonImports', count: jsonImportModifiedCount },
      ],
    };
  }
  return { fileCount: 0 };
};
