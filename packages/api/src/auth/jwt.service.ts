import * as jose from "jose";
import { env } from "process";

let privateKey: jose.KeyLike | null;
let publicKey: jose.KeyLike | null;
let keyId: string | null;

export function clearKeys() {
  privateKey = null;
  publicKey = null;
  keyId = null;
}

const requiredEnvironmentVariables = [
  "JWT_PRIVATE_KEY",
  "JWT_PUBLIC_KEY",
  "JWT_KEY_ID",
];

/**
 * Initialize the keys from environment variables
 */
export async function initKeys(envObj = process.env) {
  if (!privateKey || !publicKey) {
    if (requiredEnvironmentVariables.some((env) => !envObj[env])) {
      throw new Error(
        "JWT_PRIVATE_KEY, JWT_PUBLIC_KEY and JWT_KEY_ID environment variables are required"
      );
    }

    keyId = envObj.JWT_KEY_ID!;

    [privateKey, publicKey] = await Promise.all([
      jose.importPKCS8(env.JWT_PRIVATE_KEY!, "PS256"),
      jose.importSPKI(env.JWT_PUBLIC_KEY!, "PS256", { extractable: true }),
    ]);
  }

  return { privateKey, publicKey };
}

/**
 * Creates a JWT with the following claims:
 * {
 *   iat: now,
 *   id: userId,
 *   exp: now + expirationHours * 60 * 60,
 *   jti: crypto.randomUUID(),
 * }
 */
export async function sign(
  userId: string,
  expirationHours: number = 2
): Promise<string> {
  await initKeys();

  const now = Math.floor(Date.now() / 1000);

  const jwt = await new jose.SignJWT({
    id: userId,
  })
    .setProtectedHeader({ alg: "PS256", typ: "JWT", kid: keyId! })
    .setIssuedAt(now)
    .setExpirationTime(now + expirationHours * 60 * 60)
    .setJti(crypto.randomUUID())
    .sign(privateKey!);

  return jwt;
}

/**
 * Validate the token and return the payload if valid
 * Throws if the token is invalid
 */
export async function verify(token: string) {
  await initKeys();

  const { payload } = await jose.jwtVerify(token, publicKey!, {
    algorithms: ["PS256"],
  });

  return payload;
}

/**
 * Returns the JWKS for the /.well-known/jwks endpoint
 */
export async function getJWKS() {
  await initKeys();

  const publicJWK = await jose.exportJWK(publicKey!);

  return {
    keys: [
      {
        ...publicJWK,
        kid: keyId,
        use: "sig",
        alg: "PS256",
      },
    ],
  };
}

/**
 * Generate new key pair and return environment variables
 * This is a dev-only utility
 */
export async function generateKeys() {
  // Generate key pair
  const { publicKey, privateKey } = await jose.generateKeyPair("PS256", {
    extractable: true,
  });

  // Convert keys to PEM format
  const privatePKCS8 = await jose.exportPKCS8(privateKey);
  const publicSPKI = await jose.exportSPKI(publicKey);

  // Generate a key ID
  const kid = crypto.randomUUID();
  return {
    kid,
    public: publicSPKI,
    private: privatePKCS8,
  };
}
