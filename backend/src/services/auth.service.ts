import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authService = {
  /**
   * Register a new user.
   */
  async register(email: string, password: string, name?: string) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw Object.assign(new Error("User with this email already exists"), { statusCode: 409 });
    }

    const user = await prisma.user.create({
      data: { email, password, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return user;
  },

  /**
   * Login — simple email/password check (no JWT yet).
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, createdAt: true },
    });
    if (!user) {
      throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
    }

    // Simple plaintext comparison for now
    // TODO: Replace with bcrypt hash comparison in production
    if (user.password !== password) {
      throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  },

  /**
   * Google OAuth Login/Registration
   * Verifies the Google id_token and finds/creates the user.
   */
  async googleLogin(idToken: string) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw Object.assign(new Error("Google OAuth is not configured on the server"), { statusCode: 500 });
    }

    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw Object.assign(new Error("Invalid Google token"), { statusCode: 401 });
    }

    const { email, name, sub: googleId } = payload;

    // Check if user exists by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    });

    if (user) {
      // If user exists but doesn't have googleId linked yet, link it
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, name: user.name || name }
        });
      }
    } else {
      // Register new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
        }
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  },

  /**
   * Get user profile by ID.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    return user;
  },

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return user;
  },
};
