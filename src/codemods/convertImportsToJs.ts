import type { Project } from 'ts-morph';

const ignoredFileExtensions = ['.svg', '.png', '.css'];

export function convertImportsToJs(project: Project, filePath: string) {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    // biome-ignore lint/suspicious/noConsole: ok here
    console.error(`File not found in ts-morph project: ${filePath}`);
    return 0;
  }

  let modified = false;

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
      modified = true;
      return;
    }

    if (!moduleSpecifier.endsWith('.js')) {
      const updatedSpecifier = `${moduleSpecifier}.js`;
      importDeclaration.setModuleSpecifier(updatedSpecifier);
      modified = true;
    }
  });

  if (modified) {
    // biome-ignore lint/suspicious/noConsole: ok here
    console.log('  ✏', sourceFile.getFilePath().toString());
    sourceFile.saveSync();
    return 1;
  }

  return 0;
}
