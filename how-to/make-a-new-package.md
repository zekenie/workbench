---
as_of: 2025-02-17
---

```zsh
cd packages
mkdir $pkg
bun init
cp ../event-schemas/tsconfig.json ./tsconfig.json
mkdir src
```


Add the following to the package json

```json
{
  "module": "./dist/index.ts",
  "type": "module",
  "types": "dist/index.d.ts",
  "private": true,
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
},
"scripts": {
  "build": "rm -rf ./dist && bun build ./src/index.ts --outdir ./dist --external zod --target node && tsc",
  "typecheck": "tsc --noEmit",
  "start": "bun run ./src/index.ts"
}
```

```zsh
bun run build
```

(it should work)
