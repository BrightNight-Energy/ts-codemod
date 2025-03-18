# Typescript '.js' import Codemod

[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
![GitHub CI](https://github.com/BrightNight-Energy/ts-ecma-import-codmod/actions/workflows/cicd.yml/badge.svg)
[![npm version](https://badge.fury.io/js/ts-ecma-import-codmod.svg)](https://badge.fury.io/js/ts-ecma-import-codmod)

## Codemods

### Update imports to .js

Codmod to turn all Typescript imports to '.js', as customary for ECMA modules.

```shell
ts-ecma-import-codmod src/ -c tsconfig.json
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
ts-ecma-import-codmod src/ -c tsconfig.json -t mui-icons
```

For example, will turn:
```typescript
import myIcon from "@mui/material-icons/Icon";
```

into

```typescript
import { Icon as myIcon } from "@mui/material-icons";
```

## Installation

```shell
npm install -g ts-ecma-import-codmod
````
