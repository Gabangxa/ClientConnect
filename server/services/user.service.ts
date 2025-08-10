import { users, type User, type UpsertUser } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export class UserService {
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