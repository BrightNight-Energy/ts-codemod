import type { Project } from 'ts-morph';

export type AllowedTypes =
  | 'convert-to-.js-imports'
  | 'merge-mui-icons'
  | 'remove-.js-imports'
  | 'merge-duplicate-imports'
  | 'react-query-v5-migrate';

export type TransformedCount = {
  transformed?: Array<{ name: string; count: number }>;
  fileCount: number;
};
export type Callback = (project: Project, sourceFile: string) => TransformedCount;
