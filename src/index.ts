#!/usr/bin/env node
import { Project } from 'ts-morph';
import path from 'node:path';
import { Command } from 'commander';
import { processTarget } from './process.js';

const program = new Command();
program
  .version('1.0.1')
  .description('Convert TypeScript relative imports to .js extensions')
  .argument('<directory>', 'Source directory')
  .option('-c, --config <path>', 'Path to tsconfig.json', 'tsconfig.json')
  .parse(process.argv);

const options = program.opts();
const sourceDir = path.resolve(program.args[0] ?? '');

const project = new Project({ tsConfigFilePath: options.config });

const count = processTarget(project, sourceDir);
// biome-ignore lint/suspicious/noConsole: ok here
console.log(`🚀 Converted all relative imports to .js for ${count} file${count > 1 ? 's' : ''}`);
