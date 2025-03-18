import fs from 'node:fs';
import path from 'node:path';
import { Project } from 'ts-morph';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { processTarget } from './process.js';

// Temporary test file setup
const tempDir = path.join(__dirname, 'temp');
const testFilePath = path.join(tempDir, 'test-file.ts');
let project: Project;

beforeEach(() => {
  // Create a temporary directory for testing
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  fs.writeFileSync(
    testFilePath,
    'import myModule from "./myModule";\n' +
      'import { Project } from "ts-morph";\n' +
      'import type { Type } from "./myTypes";\n' +
      'import { type Type, Class } from "./myMixedModule";\n' +
      'import another from "../anotherModule";',
  );
  // Create a test TypeScript file with relative imports
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
  project.addSourceFileAtPath(testFilePath);
});

afterEach(() => {
  // Clean up test directory
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
  if (fs.existsSync(tempDir)) {
    fs.rmdirSync(tempDir);
  }
});

describe('convertImportsToJs', () => {
  it('should append .js to relative imports', () => {
    processTarget(project, tempDir);

    // Read the modified file
    const updatedContent = fs.readFileSync(testFilePath, 'utf-8');

    expect(updatedContent).toContain('import myModule from "./myModule.js";');
    expect(updatedContent).toContain('import another from "../anotherModule.js";');
    expect(updatedContent).toContain('import { Project } from "ts-morph";');
    expect(updatedContent).toContain('import type { Type } from "./myTypes.js";');
    expect(updatedContent).toContain('import { type Type, Class } from "./myMixedModule.js";');
  });

  it('should not modify non-relative imports', () => {
    const absoluteImportTestFile = path.join(tempDir, 'absolute-import.ts');
    fs.writeFileSync(absoluteImportTestFile, `import express from "express";`);

    processTarget(project, absoluteImportTestFile);

    const updatedContent = fs.readFileSync(absoluteImportTestFile, 'utf-8');
    expect(updatedContent).toBe(`import express from "express";`);

    fs.unlinkSync(absoluteImportTestFile);
  });
});
