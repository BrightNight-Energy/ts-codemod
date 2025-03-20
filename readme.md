# Typescript Import Codemod

[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
![GitHub CI](https://github.com/BrightNight-Energy/ts-import-codemod/actions/workflows/cicd.yml/badge.svg)
[![npm version](https://badge.fury.io/js/ts-import-codemod.svg)](https://badge.fury.io/js/ts-import-codemod)

Codmod to turn all Typescript imports to '.js', as customary for ECMA modules.

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

## Installation

```shell
npm install -g ts-import-codemod
````

## Running

```shell
ts-import-codemod src -c tsconfig.json
```
