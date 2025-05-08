import fs from 'node:fs';
import path from 'node:path';
import type { Project } from 'ts-morph';
import { convertImportsToJs } from './codemods/convertImportsToJs.js';
import { convertMuiIcons } from './codemods/convertMuiIcons.js';
import { mergeDuplicateImports } from './codemods/mergeDuplicateImports.js';
import { reactQueryV5Migrate } from './codemods/reactQueryV5Migrate.js';
import { removeJsImports } from './codemods/removeJsImports.js';
import type { AllowedTypes, Callback, TransformedCount } from './types.js';

const callbackMap: Record<AllowedTypes, Callback> = {
  '.js': convertImportsToJs,
  'remove-.js': removeJsImports,
  'mui-icons': convertMuiIcons,
  merge: mergeDuplicateImports,
  'react-query-v5-migrate': reactQueryV5Migrate,
};

const updateCount = (incCount: TransformedCount, totalCount: TransformedCount) => {
  const allNames = new Set([
    ...(incCount.transformed?.map((c) => c.name) ?? []),
    ...(totalCount.transformed?.map((c) => c.name) ?? []),
  ]);
  const transformed: TransformedCount['transformed'] = [];
  allNames.forEach((name) => {
    transformed.push({
      name: name,
      count:
        (incCount.transformed?.find((c) => c.name === name)?.count ?? 0) +
        (totalCount.transformed?.find((c) => c.name === name)?.count ?? 0),
    });
  });

  return { transformed, fileCount: incCount.fileCount + totalCount.fileCount };
};

export function processTarget(
  project: Project,
  target: string,
  type: AllowedTypes = '.js',
  initCount?: TransformedCount,
) {
  const callback = callbackMap[type];
  let count = initCount ?? { transformed: [], fileCount: 0 };
  if (fs.statSync(target).isDirectory()) {
    const files = fs.readdirSync(target);
    for (const file of files) {
      const fullPath = path.join(target, file);
      if (fs.statSync(fullPath).isDirectory()) {
        count = processTarget(project, fullPath, type, count);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        count = updateCount(callback(project, fullPath), count);
      }
    }
  } else if (target.endsWith('.ts') || target.endsWith('.tsx')) {
    count = updateCount(callback(project, target), count);
  }
  return count;
}
