declare module "bun" {
  interface Env {
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;

    JWT_KEY_ID: string;
    JWT_PUBLIC_KEY: string;
    JWT_PRIVATE_KEY: string;

    FLY_RUNTIME_IMAGE: string;
    FLY_GRAPHQL_URL: string;
    FLY_API_TOKEN: string;
    FLY_API_URL: string;
    FLY_ORG_SLUG: string;
    PORT: string;
  }
}
