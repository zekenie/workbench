You can see an [example program](./example-program.json)

# Runtime

A reactive runtime environment that wraps [ObservableHQ's runtime](https://github.com/observablehq/runtime) to execute compiled programs. This package handles program execution, state management, and communication with the API server to enable live program updates.

## What It Does

The runtime handles:

0. **Compiles**: Uses the [compiler](../compiler) to convert a tldraw document (here is an [example program](./example-program.json)) into a live Observable runtime
1. **Program Execution**: Uses ObservableHQ's runtime to execute compiled code in a reactive environment where nodes can depend on and react to each other's values

2. **Live Updates**: Maintains authenticated connection to the API server to:
  - Subscribe to program changes via [snapshot streams](../api/src/snapshot)
  - When the program has been updated, we are notified by the API subscription and we update the code in the runtime
  - Verify program state with digests (**WARNING**: currently broken!)
  - Apply patches to keep programs in sync

3. **Value Observation**: Tracks and propagates changes through the program's dependency graph

4. **State Inspection**: Development server exposes program state for debugging and observation

## Architecture

The runtime operates in conjunction with an API server:

1. Runtime authenticates with API server using provided credentials
2. Subscribes to snapshot stream for program updates
3. Maintains program state through patches and digest verification
4. Executes program using ObservableHQ runtime
5. Exposes state and updates through dev server


## Running via CLI

The runtime can be executed via command line with the following options:

### Basic Usage

```bash
canvas-runtime --source <path-to-program> --port <port-number>
```

### CLI Options

- `--source`: Path to the source program JSON file (required)
- `--port`: Port number for the dev server (default: 3000)
- `--api-id`: Client identifier for API authentication
- `--api-secret`: Client secret for API authentication
- `--api-domain`: API server domain
- `--canvas-id`: Program identifier in API server's database
- `--no-api`: Run without API server integration (offline mode)

### Examples

```bash
# Run with local file only (offline mode)
canvas-runtime --source ./my-program.json --no-api

# Run with API integration
canvas-runtime --source ./my-program.json \
  --api-id="client123" \
  --api-secret="secret456" \
  --api-domain="api.canvas.dev" \
  --canvas-id="prog789"

# Specify custom port
canvas-runtime --source ./my-program.json --port 8080
```

When running in offline mode (`--no-api`), the runtime will only execute the local program without attempting to connect to an API server for live updates.


## Technical Details

### Object Pagination

The [object pagination system](./src/object-pagination) enables efficient inspection of large program states through:

- Dual traversal strategies (breadth-first "wide" and depth-first "deep")
- Cursor-based navigation using dot-notation paths
- Safe handling of circular references and complex structures
- Preview generation with configurable page sizes

This system allows dev tools to incrementally explore large program states without requiring full serialization, making state inspection both performant and memory-efficient.

The system is currently being integrated to the dev server.

### API Integration

The runtime requires several environment variables for API server communication:
- `API_ID`: Client identifier
- `API_SECRET`: Client secret
- `API_DOMAIN`: API server domain
- `CANVAS_ID`: Program identifier in API server's database.
- `SOURCE`: Local source file path. New changes from the API server will be persisted there. If there is nothing there it will be downloaded.
- `PORT`: Dev server port

This package is designed to be a robust execution environment for reactive programs, handling both program execution and state management while maintaining live updates through API server integration.
