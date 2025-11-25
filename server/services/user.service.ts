/**
 * User Service
 * Handles all user management operations including authentication, profile management,
 * and admin user status management following Single Responsibility Principle
 */

import { db } from "../db";
import { users } from "@shared/schema";
import type { User, InsertUser } from "@shared/schema";
import { eq, and, sql, asc } from "drizzle-orm";

export class UserService {
  /**
   * Get user by ID
   * @param id - User ID
   * @returns User or undefined
   */
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  /**
   * Get user by email
   * @param email - User email
   * @returns User or undefined
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  /**
   * Create a new user
   * @param insertUser - User data to insert
   * @returns Created user
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  /**
   * Update user information
   * @param id - User ID
   * @param data - Partial user data to update
   * @returns Updated user or undefined
   */
  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  /**
   * Delete user account
   * @param id - User ID
   */
  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  /**
   * Get all users with optional filtering
   * Admin function to retrieve users based on role, status, or search query
   * @param params - Filter parameters (role, status, search)
   * @returns Array of users matching criteria
   */
  async getUsers(params: { role?: string; status?: string; search?: string }): Promise<User[]> {
    const conditions = [];

    if (params.role) conditions.push(eq(users.role, params.role as User['role']));
    if (params.status) conditions.push(eq(users.status, params.status as User['status']));
    if (params.search) {
      // Case-insensitive search on name or email
      conditions.push(sql`${users.name} ILIKE ${'%' + params.search + '%'} OR ${users.email} ILIKE ${'%' + params.search + '%'}`);
    }

    const results = await db
      .select()
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(users.name));

    return results;
  }

  /**
   * Update user account status (block, deactivate, or activate)
   * Admin function for account management
   * @param id - User ID
   * @param status - New status (active, blocked, or deactivated)
   * @returns Updated user or undefined
   */
  async updateUserStatus(id: string, status: 'active' | 'blocked' | 'deactivated'): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }
}

// Export singleton instance
export const userService = new UserService();
