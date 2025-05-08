import {
  type ObjectLiteralExpression,
  type PropertyAssignment,
  type ShorthandPropertyAssignment,
  type SpreadAssignment,
  SyntaxKind,
  ts,
} from 'ts-morph';
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

  for (const importDecl of importDecls) {
    for (const namedImport of importDecl.getNamedImports()) {
      const origName = namedImport.getName();
      const aliasNode = namedImport.getAliasNode();
      const localName = aliasNode ? aliasNode.getText() : origName;
      if (['useQuery', 'useInfiniteQuery'].includes(origName)) {
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
          const props: ts.ObjectLiteralElementLike[] = [
            ts.factory.createPropertyAssignment('queryKey', arg0?.compilerNode as ts.Expression),
            ts.factory.createPropertyAssignment('queryFn', arg1?.compilerNode as ts.Expression),
          ];
          if (arg2?.getKind() === SyntaxKind.ObjectLiteralExpression) {
            for (const prop of (arg2 as ObjectLiteralExpression).getProperties()) {
              if (prop.getKind() === SyntaxKind.PropertyAssignment) {
                const pa = prop as PropertyAssignment;
                props.push(
                  ts.factory.createPropertyAssignment(
                    pa.getName(),
                    pa.getInitializer()?.compilerNode as ts.Expression,
                  ),
                );
              } else if (prop.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
                const spa = prop as ShorthandPropertyAssignment;
                props.push(
                  ts.factory.createShorthandPropertyAssignment(
                    spa.getNameNode().compilerNode as ts.Identifier,
                  ),
                );
              } else if (prop.getKind() === SyntaxKind.SpreadAssignment) {
                const sa = prop as SpreadAssignment;
                props.push(
                  ts.factory.createSpreadAssignment(
                    sa.getExpression().compilerNode as ts.Expression,
                  ),
                );
              }
            }
          }
          // If arg2 is provided but isn't an object literal, spread it directly
          if (arg2 && arg2?.getKind() !== SyntaxKind.ObjectLiteralExpression) {
            props.push(ts.factory.createSpreadAssignment(arg2.compilerNode as ts.Expression));
          }

          const objLiteral = ts.factory.createObjectLiteralExpression(props);
          // Print the newly created object literal as it has no real source positions
          const printer = ts.createPrinter();
          const printed = printer.printNode(
            ts.EmitHint.Unspecified,
            objLiteral,
            sourceFile.compilerNode,
          );
          call.replaceWithText(`${localName}${typeArgText}(${printed})`);
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
          // Build options: inline literal props or spread everything else
          let optsText = '';
          if (arg1) {
            if (arg1.getKind() === SyntaxKind.ObjectLiteralExpression) {
              // strip the braces and inline
              const inner = arg1.getText().slice(1, -1).trim();
              optsText = inner ? `, ${inner}` : '';
            } else {
              // e.g. mutationOptions
              optsText = `, ...${arg1.getText()}`;
            }
          }
          const newText = `${localName}${typeArgText}({ mutationFn: ${arg0?.getText()}${optsText} })`;
          call.replaceWithText(newText);
        }
        mutationCount += 1;
      }
    }
  }

  // Also rename any direct property access .isLoading → .isPending on mutation result objects
  sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((access) => {
    if (access.getName() === 'isLoading') {
      access.getNameNode().replaceWithText('isPending');
    }
  });

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
