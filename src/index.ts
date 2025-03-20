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

const allTypes: Array<AllowedTypes> = ['.js', 'mui-icons', 'remove-.js', 'merge'];

if (!allTypes.includes(options.type)) {
  // biome-ignore lint/suspicious/noConsole: ok here
  console.error(`❌ Specified type '${options.type}' not supported.`);
} else {
  const count = processTarget(project, sourceDir, options.type);
  // biome-ignore lint/suspicious/noConsole: ok here
  console.log(`🚀 Converted imports for ${count} file${count > 1 ? 's' : ''}`);
}
