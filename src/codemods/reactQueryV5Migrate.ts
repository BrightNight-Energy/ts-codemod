import { SyntaxKind } from 'ts-morph';
import type { Callback } from '../types.js';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: it's fine
export const reactQueryV5Migrate: Callback = (project, filePath) => {
  const sourceFile = project.addSourceFileAtPathIfExists(filePath);
  if (!sourceFile) {
    console.error(`File not found in ts-morph project: ${filePath}`);
    return { fileCount: 0 };
  }

  let queryCount = 0;
  let mutationCount = 0;

  const importDecls = sourceFile
    .getImportDeclarations()
    .filter((d) => d.getModuleSpecifierValue() === '@tanstack/react-query');
  if (importDecls.length === 0) {
    return { fileCount: 0 };
  }

  for (const importDecl of importDecls) {
    for (const namedImport of importDecl.getNamedImports()) {
      const origName = namedImport.getName();
      const aliasNode = namedImport.getAliasNode();
      const localName = aliasNode ? aliasNode.getText() : origName;
      if (origName === 'useQuery') {
        const calls = sourceFile
          .getDescendantsOfKind(SyntaxKind.CallExpression)
          .filter(
            (call) =>
              call.getExpression().getKind() === SyntaxKind.Identifier &&
              call.getExpression().getText() === localName,
          );
        for (const call of calls) {
          const args = call.getArguments();
          if (args.length < 2) continue;
          const [arg0, arg1, arg2] = args;
          // Preserve any existing type arguments
          const typeArgs = call.getTypeArguments().map((t) => t.getText());
          const typeArgText = typeArgs.length ? `<${typeArgs.join(', ')}>` : '';
          const optsSpread = arg2 ? `, ...${arg2.getText()}` : '';
          const newText = `${localName}${typeArgText}({ queryKey: ${arg0?.getText()}, queryFn: ${arg1?.getText()}${optsSpread} })`;
          call.replaceWithText(newText);
          queryCount += 1;
        }
      }
      if (origName === 'useMutation') {
        const calls = sourceFile
          .getDescendantsOfKind(SyntaxKind.CallExpression)
          .filter(
            (call) =>
              call.getExpression().getKind() === SyntaxKind.Identifier &&
              call.getExpression().getText() === localName,
          );
        for (const call of calls) {
          const args = call.getArguments();
          if (args.length < 1) continue;
          const [arg0, arg1] = args;
          // Skip already-migrated v5 calls with options object
          if (arg0?.getKind() === SyntaxKind.ObjectLiteralExpression) continue;
          // Preserve any existing type arguments
          const typeArgs = call.getTypeArguments().map((t) => t.getText());
          const typeArgText = typeArgs.length ? `<${typeArgs.join(', ')}>` : '';
          const optsSpread = arg1 ? `, ...${arg1.getText()}` : '';
          const newText = `${localName}${typeArgText}({ mutationFn: ${arg0?.getText()}${optsSpread} })`;
          call.replaceWithText(newText);
          mutationCount += 1;
        }
      }
    }
  }

  sourceFile.saveSync();

  if (mutationCount || queryCount) {
    console.log('  ✏', sourceFile.getFilePath());
    return {
      fileCount: 1,
      transformed: [
        { name: 'useMutations', count: mutationCount },
        { name: 'useQueries', count: queryCount },
      ],
    };
  }

  return { fileCount: 0 };
};
