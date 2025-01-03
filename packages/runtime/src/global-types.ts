declare module "bun" {
  interface Env {
    API_ID?: string;
    API_SECRET?: string;
    API_DOMAIN?: string;
    SOURCE?: string;
    CANVAS_ID?: string;
    PORT?: string;
  }
}
