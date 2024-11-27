import { describe, expect, test, beforeEach } from "bun:test";
import {
  generateKeys,
  initKeys,
  sign,
  verify,
  getJWKS,
  clearKeys,
} from "./jwt.service";

describe("JWT Handler", () => {
  // Test environment setup
  let testEnv: Record<string, string>;

  beforeEach(async () => {
    // Generate fresh keys for each test
    const keys = await generateKeys();
    testEnv = {
      JWT_PRIVATE_KEY: keys.private,
      JWT_PUBLIC_KEY: keys.public,
      JWT_KEY_ID: keys.kid,
    };
    clearKeys(); // Clear cached keys before each test
  });

  describe("initKeys", () => {
    test("successfully initializes with valid environment variables", async () => {
      const { privateKey, publicKey } = await initKeys(testEnv);
      expect(privateKey).toBeDefined();
      expect(publicKey).toBeDefined();
    });

    test("throws error when environment variables are missing", async () => {
      const invalidEnv = { ...testEnv };
      delete invalidEnv.JWT_PRIVATE_KEY;

      expect(initKeys(invalidEnv)).rejects.toThrow(
        "JWT_PRIVATE_KEY, JWT_PUBLIC_KEY and JWT_KEY_ID environment variables are required"
      );
    });

    test("caches keys after first initialization", async () => {
      const firstInit = await initKeys(testEnv);
      const secondInit = await initKeys({}); // Empty env should work due to caching

      expect(firstInit).toEqual(secondInit);
    });
  });

  describe("sign", () => {
    test("creates valid JWT with correct claims", async () => {
      await initKeys(testEnv);
      const userId = "user123";
      const expirationHours = 2;

      const token = await sign(userId, expirationHours);
      const payload = await verify(token);

      expect(payload.id).toBe(userId);
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
      expect(payload.jti).toBeDefined();

      // Verify expiration time is set correctly
      const now = Math.floor(Date.now() / 1000);
      expect(payload.exp).toBeGreaterThan(now);
      expect(payload.exp).toBeLessThanOrEqual(
        now + expirationHours * 60 * 60 + 1
      );
    });

    test("uses default expiration time when not provided", async () => {
      await initKeys(testEnv);
      const userId = "user123";

      const token = await sign(userId);
      const payload = await verify(token);

      const now = Math.floor(Date.now() / 1000);
      expect(payload.exp).toBeGreaterThan(now);
      expect(payload.exp).toBeLessThanOrEqual(now + 2 * 60 * 60 + 1);
    });
  });

  describe("verify", () => {
    test("successfully verifies valid token", async () => {
      await initKeys(testEnv);
      const token = await sign("user123");
      const payload = await verify(token);
      expect(payload.id).toBe("user123");
    });

    test("rejects expired token", async () => {
      await initKeys(testEnv);
      const token = await sign("user123", -1); // Create already expired token
      expect(verify(token)).rejects.toThrow();
    });

    test("rejects tampered token", async () => {
      await initKeys(testEnv);
      const token = await sign("user123");
      const tamperedToken = token.slice(0, -5) + "12345"; // Modify the signature
      expect(verify(tamperedToken)).rejects.toThrow();
    });
  });

  describe("getJWKS", () => {
    test("returns valid JWKS structure", async () => {
      await initKeys(testEnv);
      const jwks = await getJWKS();

      // Check that we have exactly one key
      expect(jwks.keys).toBeArrayOfSize(1);
      const key = jwks.keys[0];

      // Check required JWKS fields
      expect(key.kid).toBe(testEnv.JWT_KEY_ID);
      expect(key.use).toBe("sig");
      expect(key.alg).toBe("PS256");
      expect(key.kty).toBe("RSA");

      // Check required RSA public key parameters
      expect(key.n).toBeString(); // Modulus
      expect(key.e).toBeString(); // Exponent
      expect(key.e).toBe("AQAB"); // RSA public exponent is typically AQAB (65537 in base64url)
    });
  });

  describe("generateKeys", () => {
    test("generates valid key pair and ID", async () => {
      const keys = await generateKeys();

      expect(keys.private).toBeString();
      expect(keys.private).toInclude("BEGIN PRIVATE KEY");
      expect(keys.public).toBeString();
      expect(keys.public).toInclude("BEGIN PUBLIC KEY");
      expect(keys.kid).toBeString();
      expect(keys.kid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });
});
