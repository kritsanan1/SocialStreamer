// API Integration Tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import type { Server } from 'http'
import { setupExpressApp } from '../../server/routes'
import { storage } from '../../server/storage'
import type { User } from '../../shared/schema'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'

describe('API Integration Tests', () => {
  let app: Server
  let testUser: User
  let authToken: string

  beforeEach(async () => {
    app = setupExpressApp()
    
    // Create test user
    testUser = await storage.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'user'
    })

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    )
  })

  afterEach(() => {
    app.close()
  })

  describe('Authentication Endpoints', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe('admin@example.com')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.message).toContain('Invalid credentials')
    })

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(testUser.id)
      expect(response.body.email).toBe(testUser.email)
      expect(response.body).not.toHaveProperty('password')
    })

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.body.message).toContain('No token provided')
    })
  })

  describe('Social Accounts Endpoints', () => {
    it('should get user social accounts', async () => {
      // Create test social account
      await storage.createSocialAccount({
        userId: testUser.id,
        platform: 'facebook',
        accountId: 'fb-123',
        accountName: 'Test Facebook Page',
        status: 'connected'
      })

      const response = await request(app)
        .get('/api/social-accounts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].platform).toBe('facebook')
      expect(response.body[0].accountName).toBe('Test Facebook Page')
    })

    it('should initiate social account connection', async () => {
      // Update user with Ayrshare profile
      await storage.updateUser(testUser.id, {
        ayrshareProfileKey: 'profile-key-123'
      })

      const response = await request(app)
        .post('/api/social-accounts/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ platform: 'facebook' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('authUrl')
      expect(response.body).toHaveProperty('state')
      expect(response.body.platform).toBe('facebook')
    })

    it('should delete social account', async () => {
      const account = await storage.createSocialAccount({
        userId: testUser.id,
        platform: 'instagram',
        accountId: 'ig-456',
        accountName: 'Test Instagram',
        status: 'connected'
      })

      const response = await request(app)
        .delete(`/api/social-accounts/${account.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toContain('disconnected successfully')
    })
  })

  describe('Posts Endpoints', () => {
    beforeEach(async () => {
      // Create connected social account for posting
      await storage.createSocialAccount({
        userId: testUser.id,
        platform: 'facebook',
        accountId: 'fb-123',
        accountName: 'Test Facebook Page',
        status: 'connected'
      })
    })

    it('should create a new post', async () => {
      const postData = {
        content: 'Test post content',
        platforms: ['facebook'],
        mediaUrls: ['https://example.com/image.jpg']
      }

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)

      expect(response.status).toBe(200)
      expect(response.body.content).toBe('Test post content')
      expect(response.body.platforms).toEqual(['facebook'])
      expect(response.body.status).toBe('published')
    })

    it('should create scheduled post', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const postData = {
        content: 'Scheduled post content',
        platforms: ['facebook'],
        scheduledAt: futureDate.toISOString()
      }

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('scheduled')
      expect(new Date(response.body.scheduledAt)).toEqual(futureDate)
    })

    it('should reject post without platforms', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test post',
          platforms: []
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('At least one platform is required')
    })

    it('should reject post for unconnected platform', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test post',
          platforms: ['twitter'] // Not connected
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('Please connect accounts for: twitter')
    })

    it('should get user posts', async () => {
      // Create test post
      await storage.createPost({
        userId: testUser.id,
        content: 'Test post content',
        platforms: ['facebook'],
        status: 'published'
      })

      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].content).toBe('Test post content')
    })

    it('should get scheduled posts', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      
      await storage.createPost({
        userId: testUser.id,
        content: 'Scheduled post',
        platforms: ['facebook'],
        status: 'scheduled',
        scheduledAt: futureDate
      })

      const response = await request(app)
        .get('/api/posts/scheduled')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].status).toBe('scheduled')
    })
  })

  describe('Analytics Endpoints', () => {
    it('should get aggregated analytics', async () => {
      // Create post and analytics
      const post = await storage.createPost({
        userId: testUser.id,
        content: 'Analytics test post',
        platforms: ['facebook'],
        status: 'published'
      })

      await storage.createAnalytics({
        postId: post.id,
        platform: 'facebook',
        impressions: 1000,
        likes: 50,
        shares: 10,
        comments: 5,
        clicks: 25,
        engagementRate: 350
      })

      const response = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.totalPosts).toBe(1)
      expect(response.body.totalImpressions).toBe(1000)
      expect(response.body.totalLikes).toBe(50)
      expect(response.body.analytics).toHaveLength(1)
    })

    it('should get dashboard summary', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('stats')
      expect(response.body).toHaveProperty('analytics')
      expect(response.body.user.id).toBe(testUser.id)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')

      expect(response.status).toBe(400)
    })

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })

      expect(response.status).toBe(401)
    })

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(403)
    })
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('ayrshareConnected')
    })
  })
})