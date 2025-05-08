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

// Tests for react-query v5 migration
describe('react-query-v5-migrate', () => {
  it('should migrate useQuery and useMutation calls to object syntax', () => {
    fs.writeFileSync(
      testFilePath,
      "import { useQuery, useMutation } from '@tanstack/react-query';\n" +
        "const data1 = useQuery(['key1'], fetchData1);\n" +
        "const data2 = useQuery(['key2'], fetchData2, queryOptions);\n" +
        'const mut1 = useMutation(handleSubmit);\n' +
        'const mut2 = useMutation(handleSubmit, mutationOptions);\n' +
        "const infQuery = useInfiniteQuery<Result, HTTPError>(['notifs'], (params) => getNotifications(...params).then((res) => formatNotifications(res, projectIdMap, user?.email)), { enabled });",
    );
    project.addSourceFileAtPath(testFilePath);

    processTarget(project, testFilePath, 'react-query-v5-migrate');

    const updatedContent = fs.readFileSync(testFilePath, 'utf-8');
    expect(updatedContent).toContain("useQuery({ queryKey: ['key1'], queryFn: fetchData1 })");
    expect(updatedContent).toContain(
      "useQuery({ queryKey: ['key2'], queryFn: fetchData2, ...queryOptions })",
    );
    expect(updatedContent).toContain('useMutation({ mutationFn: handleSubmit })');
    expect(updatedContent).toContain(
      'useMutation({ mutationFn: handleSubmit, ...mutationOptions })',
    );
    expect(updatedContent).toContain(
      "const infQuery = useInfiniteQuery<Result, HTTPError>({ queryKey: ['notifs'], queryFn: (params) => getNotifications(...params).then((res) => formatNotifications(res, projectIdMap, user?.email) }), { enabled });",
    );

    fs.unlinkSync(testFilePath);
  });

  it('should respect alias imports for useQuery and useMutation', () => {
    fs.writeFileSync(
      testFilePath,
      "import { useQuery as q, useMutation as m } from '@tanstack/react-query';\n" +
        "const data = q(['aliasKey'], aliasFetch);\n" +
        'const mut = m(aliasMutate);',
    );
    project.addSourceFileAtPath(testFilePath);

    processTarget(project, testFilePath, 'react-query-v5-migrate');

    const updatedContent = fs.readFileSync(testFilePath, 'utf-8');
    expect(updatedContent).toContain("q({ queryKey: ['aliasKey'], queryFn: aliasFetch })");
    expect(updatedContent).toContain('m({ mutationFn: aliasMutate })');

    fs.unlinkSync(testFilePath);
  });
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

    processTarget(project, tempDir, 'remove-.js-imports');

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

describe('test merge duplicates', () => {
  it('should merge duplicates', () => {
    fs.writeFileSync(
      testFilePath,
      'import myModule from "./myModule.js";\n' +
        'import { Project } from "ts-morph";\n' +
        'import { type Stuff } from "ts-morph";\n' +
        'import { type Type, Class } from "./myModule.js";\n' +
        'import * as yup from "yup";\n' +
        'import type { AnySchema } from "yup";\n' +
        'import another from "../anotherModule";\n' +
        'import { Data } from "plotly.js";',
    );
    project.addSourceFileAtPath(testFilePath);

    processTarget(project, tempDir, 'merge-duplicate-imports');

    // Read the modified file
    const updatedContent = fs.readFileSync(testFilePath, 'utf-8');

    expect(updatedContent).toContain('import myModule, { type Type, Class } from "./myModule.js";');
    expect(updatedContent).toContain('import { Project, type Stuff } from "ts-morph";');
    expect(updatedContent).toContain('import another from "../anotherModule";');
    expect(updatedContent).toContain('import { Data } from "plotly.js";');
    expect(updatedContent).toContain('import * as yup from "yup";');
    expect(updatedContent).toContain('import { AnySchema } from "yup";');

    fs.unlinkSync(testFilePath);
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

    processTarget(project, absoluteImportTestFile, 'merge-mui-icons');

    const updatedContent = fs.readFileSync(absoluteImportTestFile, 'utf-8');
    expect(updatedContent).toContain("import { Icon as MyIcon } from '@mui/icons-material';");
    expect(updatedContent).toContain("import { Another } from '@mui/icons-material';");

    fs.unlinkSync(absoluteImportTestFile);
  });
});
