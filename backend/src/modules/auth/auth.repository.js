import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/users.js';
import { refreshTokens } from '../../db/schema/refreshTokens.js';

export class AuthRepository {
  async findUserByGoogleId(googleId) {
    if (!googleId) return null;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);
    return user || null;
  }

  async findUserByEmail(email) {
    if (!email) return null;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return user || null;
  }

  async findUserById(id) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user || null;
  }

  async createUser({ googleId, name, email, avatarUrl }) {
    const [user] = await db
      .insert(users)
      .values({
        googleId,
        name,
        email: email.toLowerCase(),
        avatarUrl,
      })
      .returning();
    return user;
  }

  async updateUser(id, { googleId, name, avatarUrl }) {
    const updateData = { updatedAt: new Date() };
    if (googleId !== undefined) updateData.googleId = googleId;
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async saveRefreshToken({ userId, tokenHash, expiresAt }) {
    const [saved] = await db
      .insert(refreshTokens)
      .values({
        userId,
        tokenHash,
        expiresAt,
      })
      .returning();
    return saved;
  }

  async findActiveRefreshToken(userId, tokenHash) {
    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    return tokenRecord || null;
  }

  async revokeRefreshToken(id) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }

  async revokeRefreshTokenByHash(tokenHash) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async revokeAllUserRefreshTokens(userId) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }
}

export const authRepository = new AuthRepository();
