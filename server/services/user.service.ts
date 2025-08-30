/**
 * User Service
 * 
 * Manages user data operations for Replit Auth integration.
 * Handles user profile management, authentication data storage,
 * and user information retrieval for the client portal system.
 * 
 * Features:
 * - User profile retrieval and management
 * - Upsert operations for auth integration
 * - Profile data synchronization with Replit Auth
 * 
 * @module UserService
 */

import { users, type User, type UpsertUser } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

/**
 * Service class for user-related operations
 * Integrates with Replit Auth for user management
 */
export class UserService {
  /**
   * Get user by ID
   * 
   * Retrieves user information from database by user ID.
   * Used for authentication validation and profile display.
   * 
   * @param {string} id - User ID from authentication claims
   * @returns {Promise<User | undefined>} User data if found
   */
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
      })
      .returning();
    return newUser;
  }
}

export const userService = new UserService();