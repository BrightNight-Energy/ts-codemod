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

  // Create a test TypeScript file with relative imports
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
});

afterEach(() => {
  // Clean up test directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('convertImportsToJs', () => {
  it('should append .js to relative imports', () => {
    fs.writeFileSync(
      testFilePath,
      'import myModule from "./myModule";\n' +
        'import { Project } from "ts-morph";\n' +
        'import type { Type } from "./myTypes";\n' +
        'import { type Type, Class } from "./myMixedModule";\n' +
        'import another from "../anotherModule";',
    );
    project.addSourceFileAtPath(testFilePath);

    processTarget(project, tempDir);

    // Read the modified file
    const updatedContent = fs.readFileSync(testFilePath, 'utf-8');

    expect(updatedContent).toContain('import myModule from "./myModule.js";');
    expect(updatedContent).toContain('import another from "../anotherModule.js";');
    expect(updatedContent).toContain('import { Project } from "ts-morph";');
    expect(updatedContent).toContain('import type { Type } from "./myTypes.js";');
    expect(updatedContent).toContain('import { type Type, Class } from "./myMixedModule.js";');

    fs.unlinkSync(testFilePath);
  });

  it('should remove .js to relative imports', () => {
    fs.writeFileSync(
      testFilePath,
      'import myModule from "./myModule.js";\n' +
        'import { Project } from "ts-morph";\n' +
        'import type { Type } from "./myTypes";\n' +
        'import { type Type, Class } from "./myMixedModule.js";\n' +
        'import another from "../anotherModule";\n' +
        'import { Data } from "plotly.js";',
    );
    project.addSourceFileAtPath(testFilePath);

    processTarget(project, tempDir, 'remove-.js');

    // Read the modified file
    const updatedContent = fs.readFileSync(testFilePath, 'utf-8');

    expect(updatedContent).toContain('import myModule from "./myModule";');
    expect(updatedContent).toContain('import another from "../anotherModule";');
    expect(updatedContent).toContain('import { Project } from "ts-morph";');
    expect(updatedContent).toContain('import type { Type } from "./myTypes";');
    expect(updatedContent).toContain('import { type Type, Class } from "./myMixedModule";');
    expect(updatedContent).toContain('import { Data } from "plotly.js";');

    fs.unlinkSync(testFilePath);
  });

  it('should not modify non-relative imports', () => {
    const absoluteImportTestFile = path.join(tempDir, 'absolute-import.ts');
    fs.writeFileSync(absoluteImportTestFile, `import express from "express";`);

    processTarget(project, absoluteImportTestFile);

    const updatedContent = fs.readFileSync(absoluteImportTestFile, 'utf-8');
    expect(updatedContent).toBe(`import express from "express";`);

    fs.unlinkSync(absoluteImportTestFile);
  });

  it('should modify json imports', () => {
    const jsonImportTestFile = path.join(tempDir, 'json-import.ts');
    fs.writeFileSync(
      jsonImportTestFile,
      "import json1 from '../myJsonFile.json';\n" +
        "import json2 from '../myJsonFile2.json' with { type: 'json' };",
    );

    processTarget(project, jsonImportTestFile);

    const updatedContent = fs.readFileSync(jsonImportTestFile, 'utf-8');
    expect(updatedContent).toContain(
      "import json1 from '../myJsonFile.json' with { type: 'json' };",
    );
    expect(updatedContent).toContain(
      "import json2 from '../myJsonFile2.json' with { type: 'json' };",
    );

    fs.unlinkSync(jsonImportTestFile);
  });
});

describe('test convert mui icons', () => {
  it('modify mui icons', () => {
    const absoluteImportTestFile = path.join(tempDir, 'MuiIcons.tsx');
    fs.writeFileSync(
      absoluteImportTestFile,
      "import MyIcon from '@mui/icons-material/Icon';\n" +
        "import { Another } from '@mui/icons-material';",
    );

    processTarget(project, absoluteImportTestFile, 'mui-icons');

    const updatedContent = fs.readFileSync(absoluteImportTestFile, 'utf-8');
    expect(updatedContent).toContain("import { Icon as MyIcon } from '@mui/icons-material';");
    expect(updatedContent).toContain("import { Another } from '@mui/icons-material';");

    fs.unlinkSync(absoluteImportTestFile);
  });
});
