/**
 * Messaging Service
 * Handles all messaging operations including job conversations and admin chat
 * Follows Single Responsibility Principle by focusing on message-related operations
 */

import { db } from "../db";
import { messages, users, jobs } from "@shared/schema";
import type { Message, InsertMessage } from "@shared/schema";
import { eq, and, or, desc, asc, sql } from "drizzle-orm";

type MessageWithSender = Message & {
  sender: any;
};

export class MessagingService {
  /**
   * Get all messages for a specific job
   * @param jobId - Job ID
   * @returns Array of messages with sender information
   */
  async getMessages(jobId: string): Promise<MessageWithSender[]> {
    const results = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.jobId, jobId))
      .orderBy(asc(messages.createdAt));

    return results.map((r) => ({
      ...r.message,
      sender: r.sender,
    }));
  }

  /**
   * Get all admin messages for a specific user (legacy method)
   * @param userId - User ID
   * @returns Array of admin messages
   */
  async getAdminMessages(userId: string): Promise<MessageWithSender[]> {
    const results = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.messageType, 'admin_message'),
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        )
      )
      .orderBy(asc(messages.createdAt));

    return results.map((r) => ({
      ...r.message,
      sender: r.sender,
    }));
  }

  /**
   * Get dedicated admin-to-user chat messages
   * Retrieves all messages in a specific admin-user conversation
   * @param adminId - Admin user ID
   * @param targetUserId - Target user ID
   * @returns Array of messages between admin and user
   */
  async getAdminChatMessages(adminId: string, targetUserId: string): Promise<MessageWithSender[]> {
    const results = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.messageType, 'admin_message'),
          or(
            // Message sent by Admin to User
            and(eq(messages.senderId, adminId), eq(messages.receiverId, targetUserId)),
            // Message sent by User to Admin
            and(eq(messages.senderId, targetUserId), eq(messages.receiverId, adminId))
          )
        )
      )
      .orderBy(asc(messages.createdAt));

    return results.map((r) => ({
      ...r.message,
      sender: r.sender,
    }));
  }

  /**
   * Get count of unread messages for a user
   * @param userId - User ID
   * @returns Number of unread messages
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );

    return result?.count || 0;
  }

  /**
   * Create a new message
   * Automatically determines receiver for job messages if not specified
   * @param insertMessage - Message data to insert
   * @returns Created message
   */
  async createMessage(insertMessage: InsertMessage & { senderId: string }): Promise<Message> {
    // If it's a job message and no receiver specified, determine receiver from job
    let receiverId = insertMessage.receiverId;

    if (insertMessage.jobId && !receiverId) {
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, insertMessage.jobId));

      if (job) {
        // Receiver is the other party in the job
        receiverId = job.requesterId === insertMessage.senderId
          ? job.providerId
          : job.requesterId;
      }
    }

    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        receiverId,
        isRead: false,
      })
      .returning();

    return message;
  }

  /**
   * Mark a specific message as read
   * @param messageId - Message ID
   * @param userId - User ID (must be the receiver)
   * @returns Updated message or undefined
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<Message | undefined> {
    const [updated] = await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.receiverId, userId)
        )
      )
      .returning();

    return updated || undefined;
  }

  /**
   * Mark all messages in a conversation as read
   * @param jobId - Job ID
   * @param userId - User ID (must be the receiver)
   */
  async markAllMessagesRead(jobId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(messages.jobId, jobId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  /**
   * Get primary admin user
   * @returns Admin user or undefined
   */
  private async getAdminUser(): Promise<any | undefined> {
    const [admin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    return admin;
  }

  /**
   * Mark all admin messages as read for a user
   * @param userId - User ID
   */
  async markAllAdminMessagesRead(userId: string): Promise<void> {
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(messages.messageType, 'admin_message'),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  /**
   * Get all conversations for a user including job chats and admin messages
   * @param userId - User ID
   * @returns Array of conversation summaries with unread counts
   */
  async getConversations(userId: string): Promise<any[]> {
    // Get all jobs where user is involved
    const userJobs = await db
      .select({
        job: jobs,
        requester: users,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .where(or(eq(jobs.requesterId, userId), eq(jobs.providerId, userId)));

    const conversations = [];

    // Job-based conversations
    for (const { job, requester } of userJobs) {
      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.jobId, job.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      if (lastMessage) {
        const otherUserId = job.requesterId === userId ? job.providerId : job.requesterId;
        const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId!));

        // Count unread messages
        const [unreadResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.jobId, job.id),
              eq(messages.receiverId, userId),
              eq(messages.isRead, false)
            )
          );

        conversations.push({
          jobId: job.id,
          jobTitle: job.title,
          otherUser,
          lastMessage: lastMessage.messageText,
          lastMessageTime: lastMessage.createdAt,
          unreadCount: unreadResult?.count || 0,
          messageType: lastMessage.messageType,
        });
      }
    }

    // Add admin messages if any
    const adminUser = await this.getAdminUser();

    if (adminUser) {
      const [lastAdminMessage] = await db
        .select({
          message: messages,
          sender: users,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(
          and(
            eq(messages.messageType, 'admin_message'),
            or(
              // Message sent by Admin to User
              and(eq(messages.senderId, adminUser.id), eq(messages.receiverId, userId)),
              // Message sent by User to Admin
              and(eq(messages.senderId, userId), eq(messages.receiverId, adminUser.id))
            )
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);

      if (lastAdminMessage) {
        const [unreadAdminResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.messageType, 'admin_message'),
              eq(messages.receiverId, userId),
              eq(messages.isRead, false)
            )
          );

        conversations.push({
          jobId: 'admin-messages',
          jobTitle: 'Admin Messages',
          otherUser: adminUser,
          lastMessage: lastAdminMessage.message.messageText,
          lastMessageTime: lastAdminMessage.message.createdAt,
          unreadCount: unreadAdminResult?.count || 0,
          messageType: 'admin_message',
        });
      }
    }

    return conversations.sort((a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }

  /**
   * Get all conversations from admin perspective
   * @returns Array of all users admin has messaged
   */
  async getAdminConversations(): Promise<any[]> {
    const adminUser = await this.getAdminUser();

    if (!adminUser) return [];

    // Get messages sent/received by the admin
    const results = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.messageType, 'admin_message'),
          or(
            eq(messages.senderId, adminUser.id),
            eq(messages.receiverId, adminUser.id)
          )
        )
      )
      .orderBy(desc(messages.createdAt));

    // Group by unique user
    const conversationMap = new Map();
    for (const result of results) {
      const otherUserId = result.message.senderId === adminUser.id
        ? result.message.receiverId
        : result.message.senderId;

      if (!conversationMap.has(otherUserId)) {
        const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId!));
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          user: otherUser,
          lastMessage: result.message.messageText,
          lastMessageTime: result.message.createdAt,
          unreadCount: result.message.receiverId === adminUser.id && !result.message.isRead ? 1 : 0,
        });
      } else {
        // Update unread count if message is unread and admin is receiver
        const conv = conversationMap.get(otherUserId);
        if (result.message.receiverId === adminUser.id && !result.message.isRead) {
          conv.unreadCount += 1;
        }
      }
    }

    return Array.from(conversationMap.values())
      .sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
