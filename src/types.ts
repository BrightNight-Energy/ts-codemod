import type { Project } from 'ts-morph';

export type AllowedTypes = '.js' | 'mui-icons' | 'remove-.js' | 'merge' | 'react-query-v5-migrate';

export type TransformedCount = {
  transformed?: Array<{ name: string; count: number }>;
  fileCount: number;
};
export type Callback = (project: Project, sourceFile: string) => TransformedCount;
