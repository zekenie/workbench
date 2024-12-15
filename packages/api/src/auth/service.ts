import { User } from "@prisma/client";
import { prisma } from "../db";
import { createHash } from "crypto";

type HashAlgorithm = "sha256" | "sha512" | "md5";
type DigestFormat = "hex" | "base64";

export function hashString(
  input: string,
  algorithm: HashAlgorithm = "sha256",
  encoding: DigestFormat = "hex"
): string {
  return createHash(algorithm).update(input).digest(encoding);
}

type CreateUserDTO = {
  email: string;
  password: string;
};

type VerifyPasswordDTO = {
  email: string;
  password: string;
};

export async function findUserById({ id }: { id: string }) {
  return prisma.user.findFirst({ where: { id } });
}

export async function findUserByEmail({ email }: { email: string }) {
  return prisma.user.findFirst({ where: { email } });
}

export async function createUser(dto: CreateUserDTO) {
  try {
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await Bun.password.hash(dto.password),
        id: Bun.randomUUIDv7(),
      },
    });

    const refreshToken = await generateRefreshToken(32, { user });

    return { refreshToken, user };
  } catch (e) {
    if ((e as Error).name === "PrismaClientKnownRequestError") {
      throw new EmailTakenError();
    }
    throw e;
  }
}

export async function verifyPassword(dto: VerifyPasswordDTO) {
  const user = await findUserByEmail({ email: dto.email });
  if (!user) {
    throw new UserNotFoundError();
  }
  const refreshToken = await generateRefreshToken(32, { user });
  if (!user.passwordHash) {
    throw new UserDoesNotHavePasswordHashError();
  }
  try {
    await Bun.password.verify(dto.password, user.passwordHash);
  } catch (e) {
    throw new IncorrectPasswordError();
  }
  return { user, refreshToken };
}

export class UserNotFoundError extends Error {}
export class EmailTakenError extends Error {}
export class IncorrectPasswordError extends Error {}

class UserDoesNotHavePasswordHashError extends Error {}

async function generateRefreshToken(
  bytes: number = 32,
  { user }: { user: User | null } = { user: null }
) {
  const randomBytes = crypto.getRandomValues(new Uint8Array(bytes));
  const refreshToken = btoa(String.fromCharCode(...randomBytes));
  const hash = hashString(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user?.id,
      tokenHash: hash,
    },
  });

  return refreshToken;
}

export async function useRefreshToken(token: string) {
  const hash = hashString(token);

  return prisma.$transaction(async () => {
    const storedToken = await prisma.refreshToken.findFirstOrThrow({
      include: {
        user: true,
      },
      where: {
        tokenHash: hash,
        usedAt: null,
      },
    });

    await prisma.refreshToken.update({
      data: { usedAt: new Date() },
      where: { id: storedToken.id },
    });

    const newToken = await generateRefreshToken(32, { user: storedToken.user });

    return { newToken, user: storedToken.user };
  });
}
