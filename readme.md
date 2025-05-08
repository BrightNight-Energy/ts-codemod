# Typescript Codemod

[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
![GitHub CI](https://github.com/BrightNight-Energy/ts-codemod/actions/workflows/cicd.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40brightnightpower%2Fts-codemod.svg)](https://www.npmjs.com/package/%40brightnightpower%2Fts-codemod)

A collection of mostly random codemods you (might) find helpful.


## Installation

```shell
npm install -g @brightnightpower/ts-codemod
````

## Usage

```
ts-codemod [options] <directory>

Arguments:
  directory            Source directory

Options:
  -V, --version        output the version number
  -c, --config <path>  Path to tsconfig.json (default: "tsconfig.json")
  -t, --type <type>    Type of codemod, default .js (default: ".js")
  -h, --help           display help for command
```

## Codemods

### Update imports to .js

Codmod to turn all Typescript imports to '.js', as customary for ECMA modules.

```shell
ts-codemod src/ -t convert-to-.js-imports
```

For example, will turn:
```typescript
import myModule from "./myModule";
import { type Type, Class } from "./myMixedModule";
import myJson from "./myJson.json";
```

into

```typescript
import myModule from "./myModule.js";
import { type Type, Class } from "./myMixedModule.js";
import myJson from "./myJson.json" with { type: 'json' };
```

### Update Material UI Icon imports

```shell
ts-codemod src/ -t merge-mui-icons
```

For example, will turn:
```typescript
import myIcon from "@mui/material-icons/Icon";
```

into

```typescript
import { Icon as myIcon } from "@mui/material-icons";
```

### Remove .js imports

```shell
ts-codemod src/ -t remove-.js-imports
```

For example, will turn:
```typescript
import myModule from "./myModule.js";
```

into

```typescript
import myModule from "./myModule";
```

### Merge imports

```shell
ts-codemod src/ -t merge-duplicate-imports
```

Will turn
```typescript
import myModule from "./myModule.js";
import { Project } from "ts-morph";
import { type Stuff } from "ts-morph";
import { type Type, Class } from "./myModule.js";
import * as yup from "yup";
import type { AnySchema } from "yup";
```

into
```typescript
import myModule, { type Type, Class } from "./myModule.js";
import { Project, type Stuff } from "ts-morph";
import * as yup from "yup";
import { AnySchema } from "yup"; // note: import type was dropped
import { Data } from "plotly.js";
```

> [!NOTE]
> As noted in the comment above, the 'Type' modifier in the import statement may be dropped.
> A linter like [biome](https://biomejs.dev/) will add these back in.

### Tanstack's React Query v4 to v5

```shell
ts-codemod src/ -t react-query-v5-migrate
```

Will turn
```typescript jsx
useQuery('todos', fetchTodos, { enabled: false });
useMutation(createTodo, { onSuccess });
```

into
```typescript jsx
useQuery({ queryKey: 'todos', queryFn: fetchTodos, enabled: false });
useMutation({ mutationFn: createTodo, onSuccess });
```

## Contributing

All contributions welcome! Make sure to install precommit hooks for complete functionality:
```shell
pre-commit install --install-hooks
pre-commit install --hook-type commit-msg
```
