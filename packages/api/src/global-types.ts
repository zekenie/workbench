declare module "bun" {
  interface Env {
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;

    JWT_KEY_ID: string;
    JWT_PUBLIC_KEY: string;
    JWT_PRIVATE_KEY: string;
  }
}
