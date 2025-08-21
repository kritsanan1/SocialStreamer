// Backend Storage Tests
import { describe, it, expect, beforeEach } from 'vitest'
import { MemStorage } from '../../server/storage'
import type { InsertUser, InsertSocialAccount, InsertPost } from '../../shared/schema'

describe('MemStorage', () => {
  let storage: MemStorage

  beforeEach(() => {
    storage = new MemStorage()
  })

  describe('User Management', () => {
    it('should create and retrieve a user', async () => {
      const userData: InsertUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        role: 'user'
      }

      const user = await storage.createUser(userData)
      
      expect(user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      })
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeDefined()

      const retrievedUser = await storage.getUser(user.id)
      expect(retrievedUser).toEqual(user)
    })

    it('should find user by email', async () => {
      const userData: InsertUser = {
        username: 'emailuser',
        email: 'email@test.com',
        password: 'password123',
        role: 'user'
      }

      const user = await storage.createUser(userData)
      const foundUser = await storage.getUserByEmail('email@test.com')
      
      expect(foundUser).toEqual(user)
    })

    it('should update user data', async () => {
      const userData: InsertUser = {
        username: 'updateuser',
        email: 'update@test.com',
        password: 'password123',
        role: 'user'
      }

      const user = await storage.createUser(userData)
      const updatedUser = await storage.updateUser(user.id, {
        ayrshareProfileKey: 'new-profile-key',
        ayrshareUserId: 'ayr-user-123'
      })

      expect(updatedUser.ayrshareProfileKey).toBe('new-profile-key')
      expect(updatedUser.ayrshareUserId).toBe('ayr-user-123')
    })
  })

  describe('Social Account Management', () => {
    it('should create and manage social accounts', async () => {
      // First create a user
      const userData: InsertUser = {
        username: 'socialuser',
        email: 'social@test.com',
        password: 'password123',
        role: 'user'
      }
      const user = await storage.createUser(userData)

      // Create social account
      const accountData: InsertSocialAccount = {
        userId: user.id,
        platform: 'facebook',
        accountId: 'fb-123',
        accountName: 'Test Facebook Page',
        accountHandle: '@testpage',
        status: 'connected'
      }

      const account = await storage.createSocialAccount(accountData)
      
      expect(account).toMatchObject({
        platform: 'facebook',
        accountName: 'Test Facebook Page',
        status: 'connected'
      })
      expect(account.id).toBeDefined()

      // Retrieve accounts by user
      const userAccounts = await storage.getSocialAccountsByUserId(user.id)
      expect(userAccounts).toHaveLength(1)
      expect(userAccounts[0]).toEqual(account)
    })

    it('should update social account status', async () => {
      const userData: InsertUser = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        role: 'user'
      }
      const user = await storage.createUser(userData)

      const accountData: InsertSocialAccount = {
        userId: user.id,
        platform: 'instagram',
        accountId: 'ig-456',
        accountName: 'Test Instagram',
        status: 'pending'
      }

      const account = await storage.createSocialAccount(accountData)
      
      const updatedAccount = await storage.updateSocialAccount(account.id, {
        status: 'connected',
        followerCount: 1500,
        verifiedAccount: true
      })

      expect(updatedAccount.status).toBe('connected')
      expect(updatedAccount.followerCount).toBe(1500)
      expect(updatedAccount.verifiedAccount).toBe(true)
    })
  })

  describe('Post Management', () => {
    it('should create and retrieve posts', async () => {
      // Create user first
      const userData: InsertUser = {
        username: 'postuser',
        email: 'post@test.com',
        password: 'password123',
        role: 'user'
      }
      const user = await storage.createUser(userData)

      const postData: InsertPost = {
        userId: user.id,
        content: 'Test post content',
        platforms: ['facebook', 'instagram'],
        status: 'draft'
      }

      const post = await storage.createPost(postData)
      
      expect(post).toMatchObject({
        content: 'Test post content',
        platforms: ['facebook', 'instagram'],
        status: 'draft'
      })
      expect(post.id).toBeDefined()
      expect(post.createdAt).toBeDefined()

      // Retrieve posts by user
      const userPosts = await storage.getPostsByUserId(user.id)
      expect(userPosts).toHaveLength(1)
      expect(userPosts[0]).toEqual(post)
    })

    it('should handle scheduled posts', async () => {
      const userData: InsertUser = {
        username: 'scheduleuser',
        email: 'schedule@test.com',
        password: 'password123',
        role: 'user'
      }
      const user = await storage.createUser(userData)

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      
      const postData: InsertPost = {
        userId: user.id,
        content: 'Scheduled post',
        platforms: ['twitter'],
        status: 'scheduled',
        scheduledAt: futureDate
      }

      const post = await storage.createPost(postData)
      
      const scheduledPosts = await storage.getScheduledPosts(user.id)
      expect(scheduledPosts).toHaveLength(1)
      expect(scheduledPosts[0].id).toBe(post.id)
      expect(scheduledPosts[0].scheduledAt).toEqual(futureDate)
    })
  })

  describe('Analytics Management', () => {
    it('should create and retrieve analytics', async () => {
      // Create user and post first
      const userData: InsertUser = {
        username: 'analyticsuser',
        email: 'analytics@test.com',
        password: 'password123',
        role: 'user'
      }
      const user = await storage.createUser(userData)

      const postData: InsertPost = {
        userId: user.id,
        content: 'Analytics test post',
        platforms: ['facebook'],
        status: 'published'
      }
      const post = await storage.createPost(postData)

      // Create analytics
      const analyticsData = {
        postId: post.id,
        platform: 'facebook',
        impressions: 1000,
        likes: 50,
        shares: 10,
        comments: 5,
        clicks: 25,
        engagementRate: 350
      }

      const analytics = await storage.createAnalytics(analyticsData)
      
      expect(analytics).toMatchObject(analyticsData)
      expect(analytics.id).toBeDefined()

      // Retrieve analytics by post
      const postAnalytics = await storage.getAnalyticsByPostId(post.id)
      expect(postAnalytics).toHaveLength(1)
      expect(postAnalytics[0]).toEqual(analytics)
    })
  })
})