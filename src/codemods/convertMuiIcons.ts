import type { Project } from 'ts-morph';

export function convertMuiIcons(project: Project, filePath: string) {
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
