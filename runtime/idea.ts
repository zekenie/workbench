import {
  TLRecord,
  TLStore,
  createTLStore,
  unstable_createClientSocket,
} from "@tldraw/tldraw";

class TldrawNodeClient {
  private store: TLStore;
  private socket: ReturnType<typeof unstable_createClientSocket>;

  constructor(roomId: string) {
    // Initialize the store
    this.store = createTLStore();

    // Connect to tldraw's sync service
    this.socket = unstable_createClientSocket({
      uri: `https://sync.tldraw.com`,
      roomId,
      version: 1,
    });

    // Initialize the connection
    this.socket.connect();

    // Set up store sync
    this.store.listen((update) => {
      // Send local changes to the server
      if (update.source !== "remote") {
        this.socket.broadcastPatch(update.changes);
      }
    });

    // Handle incoming changes
    this.socket.messages$.subscribe((patch) => {
      this.store.mergeRemoteChanges(patch);
    });
  }

  // Example method to create a shape
  createShape(type: string, x: number, y: number) {
    const shape = {
      id: `shape:${Date.now()}`,
      type,
      x,
      y,
      props: {},
    };

    this.store.put([shape]);
  }

  // Example method to delete a shape
  deleteShape(shapeId: string) {
    this.store.remove([shapeId]);
  }

  // Example method to update a shape
  updateShape(shapeId: string, updates: Partial<TLRecord>) {
    const shape = this.store.get(shapeId);
    if (shape) {
      this.store.update(shapeId, updates);
    }
  }

  // Cleanup method
  disconnect() {
    this.socket.disconnect();
  }
}

// Usage example
const client = new TldrawNodeClient("your-room-id");

// Create a rectangle
client.createShape("rectangle", 100, 100);

// Clean up when done
// client.disconnect()
