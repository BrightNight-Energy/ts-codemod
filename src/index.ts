#!/usr/bin/env node
import path from 'node:path';
import { Command } from 'commander';
import { Project } from 'ts-morph';
import packageJson from '../package.json' with { type: 'json' };
import { processTarget } from './process.js';
import type { AllowedTypes } from './types.js';

const program = new Command();
program
  .version(packageJson.version)
  .description('Convert TypeScript relative imports to .js extensions')
  .argument('<directory>', 'Source directory')
  .option('-c, --config <path>', 'Path to tsconfig.json', 'tsconfig.json')
  .option('-t, --type <type>', 'Type of codemod, default .js', '.js')
  .parse(process.argv);

const options = program.opts();
const sourceDir = path.resolve(program.args[0] ?? '');

const project = new Project({ tsConfigFilePath: options.config });

const allTypes: Array<AllowedTypes> = [
  '.js',
  'mui-icons',
  'remove-.js',
  'merge',
  'react-query-v5-migrate',
];

if (!allTypes.includes(options.type)) {
  console.error(
    `❌ Specified type '${options.type}' not supported. Must be one of:\n${allTypes.join('\n')}`,
  );
} else {
  const count = processTarget(project, sourceDir, options.type);
  console.log(
    `🚀 In ${count.fileCount} file${count.fileCount > 1 ? 's' : ''}, converted:\n${count.transformed
      ?.map(({ name, count }) => `  ${count} ${name}`)
      .join('\n')}`,
  );
}
