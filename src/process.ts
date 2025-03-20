import fs from 'node:fs';
import path from 'node:path';
import type { Project } from 'ts-morph';
import { convertImportsToJs } from './codemods/convertImportsToJs.js';
import { convertMuiIcons } from './codemods/convertMuiIcons.js';
import { mergeDuplicateImports } from './codemods/mergeDuplicateImports.js';
import { removeJsImports } from './codemods/removeJsImports.js';
import type { AllowedTypes } from './types.js';

const callbackMap: Record<AllowedTypes, typeof convertMuiIcons> = {
  '.js': convertImportsToJs,
  'remove-.js': removeJsImports,
  'mui-icons': convertMuiIcons,
  merge: mergeDuplicateImports,
};

export function processTarget(
  project: Project,
  target: string,
  type: AllowedTypes = '.js',
  initCount = 0,
) {
  const callback = callbackMap[type];
  let count = initCount;
  if (fs.statSync(target).isDirectory()) {
    const files = fs.readdirSync(target);
    for (const file of files) {
      const fullPath = path.join(target, file);
      if (fs.statSync(fullPath).isDirectory()) {
        count = processTarget(project, fullPath, type, count);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        count += callback(project, fullPath);
      }
    }
  } else if (target.endsWith('.ts') || target.endsWith('.tsx')) {
    count += callback(project, target);
  }
  return count;
}
