# Canvas IDE Compiler

Internal compiler package for Canvas IDE that transforms code blocks into executable functions.

## Overview

The compiler takes a room snapshot from the Canvas IDE and transforms each code block into a standalone, executable function. It handles dependencies between code blocks and maintains their relationships in the compiled output.

Key features:
- Transforms TypeScript code blocks into executable functions
- Maintains dependency relationships between code blocks
- Handles various code patterns (expressions, declarations, async functions, generators)
- Produces deterministic output with consistent hashing

## Architecture

The compiler consists of several key components:

### Compiler Class
Main entry point that orchestrates the compilation process. It:
- Extracts code and dependencies from the room snapshot
- Maps between code names and TLDraw IDs
- Produces a CompiledCanvas with compiled nodes

### NodeTransformer
Core transformation logic that:
- Converts code blocks into functions
- Handles different code patterns (expressions, declarations, etc.)
- Manages dependencies between nodes
- Uses ts-morph for TypeScript parsing and manipulation

### Code Extraction
Utilities to extract code from the room snapshot:
- Filters IDE shapes
- Extracts TypeScript code
- Maps code to their identifiers

### Dependencies
Utilities to extract and manage dependencies between code blocks.

## Usage

This is an internal package - it should not be used directly, but rather through the Canvas IDE application.

```typescript
import { Compiler } from 'compiler'

const compiler = new Compiler()
const compiledCanvas = await compiler.compile(roomSnapshot)

// Access compiled nodes
for (const node of compiledCanvas) {
  console.log(node.codeName, node.compiledCode)
}
```

## Development

### Building
Build the package with:
```bash
bun run build
```

## Internal Architecture Details

### Compilation Process
1. Extract code and dependencies from snapshot
2. Map between code names and TLDraw IDs
3. Transform each node into a function
4. Handle various code patterns (expressions, declarations)
5. Maintain dependency relationships
6. Generate consistent hashes for caching

### Code Node Types
- Simple expressions
- Function declarations
- Variable declarations
- Multi-statement blocks
- Generator functions
- Async functions

The compiler aims to be deterministic - same input should always produce the same output with identical hashes.
