// Ayrshare Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AyrshareService } from '../../server/ayrshare'
import type { User } from '../../shared/schema'

// Mock global fetch
global.fetch = vi.fn()

describe('AyrshareService', () => {
  let ayrshareService: AyrshareService
  const mockFetch = global.fetch as any

  beforeEach(() => {
    ayrshareService = new AyrshareService()
    vi.clearAllMocks()
  })

  describe('User Profile Management', () => {
    it('should create user profile successfully', async () => {
      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpass',
        role: 'user',
        createdAt: new Date(),
        ayrshareProfileKey: null,
        ayrshareUserId: null,
        ayrshareRefId: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        lastLoginAt: null,
        isActive: true
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          profileKey: 'profile-key-123',
          userId: 'ayr-user-456',
          refId: 'ref-789'
        })
      })

      const result = await ayrshareService.createUserProfile(mockUser)
      
      expect(result.status).toBe('success')
      expect(result.profileKey).toBe('profile-key-123')
      expect(result.userId).toBe('ayr-user-456')
      expect(result.refId).toBe('ref-789')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/profiles/profile'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.any(String),
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should handle profile creation failure', async () => {
      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpass',
        role: 'user',
        createdAt: new Date(),
        ayrshareProfileKey: null,
        ayrshareUserId: null,
        ayrshareRefId: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        lastLoginAt: null,
        isActive: true
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          status: 'error',
          message: 'Invalid API key'
        })
      })

      const result = await ayrshareService.createUserProfile(mockUser)
      
      expect(result.status).toBe('error')
      expect(result.message).toBe('Invalid API key')
    })
  })

  describe('JWT Generation', () => {
    it('should generate JWT for social linking', async () => {
      const profileKey = 'profile-key-123'
      const redirectUrl = 'https://app.example.com/callback'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          url: 'https://profile.ayrshare.com?jwt=mock-jwt-token',
          jwt: 'mock-jwt-token'
        })
      })

      const result = await ayrshareService.generateJWT(profileKey, redirectUrl)
      
      expect(result.status).toBe('success')
      expect(result.url).toContain('mock-jwt-token')
      expect(result.jwt).toBe('mock-jwt-token')
    })
  })

  describe('Social Account Management', () => {
    it('should retrieve user social accounts', async () => {
      const profileKey = 'profile-key-123'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          socialAccounts: {
            facebook: {
              id: 'fb-123',
              name: 'Test Facebook Page',
              handle: '@testpage',
              followers: 1500,
              verified: false
            },
            instagram: {
              id: 'ig-456',
              name: 'Test Instagram',
              handle: '@testinsta',
              followers: 850,
              verified: true
            }
          }
        })
      })

      const accounts = await ayrshareService.getUserSocialAccounts(profileKey)
      
      expect(accounts).toHaveLength(2)
      expect(accounts[0].platform).toBe('facebook')
      expect(accounts[0].accountName).toBe('Test Facebook Page')
      expect(accounts[1].platform).toBe('instagram')
      expect(accounts[1].verifiedAccount).toBe(true)
    })

    it('should handle empty social accounts', async () => {
      const profileKey = 'profile-key-123'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          socialAccounts: {}
        })
      })

      const accounts = await ayrshareService.getUserSocialAccounts(profileKey)
      
      expect(accounts).toHaveLength(0)
    })
  })

  describe('Post Creation', () => {
    it('should create post successfully', async () => {
      const profileKey = 'profile-key-123'
      const postData = {
        post: 'Test post content',
        platforms: ['facebook', 'instagram'],
        mediaUrls: ['https://example.com/image.jpg']
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'ayr-post-123',
          status: 'success',
          posts: [
            {
              platform: 'facebook',
              status: 'success',
              postId: 'fb-post-456',
              url: 'https://facebook.com/posts/456'
            },
            {
              platform: 'instagram',
              status: 'success',
              postId: 'ig-post-789',
              url: 'https://instagram.com/p/789'
            }
          ]
        })
      })

      const result = await ayrshareService.createPost(profileKey, postData)
      
      expect(result.status).toBe('success')
      expect(result.id).toBe('ayr-post-123')
      expect(result.posts).toHaveLength(2)
      expect(result.posts?.[0].platform).toBe('facebook')
      expect(result.posts?.[1].platform).toBe('instagram')
    })

    it('should handle post creation failure', async () => {
      const profileKey = 'profile-key-123'
      const postData = {
        post: 'Test post content',
        platforms: ['facebook']
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          status: 'error',
          message: 'Platform not connected'
        })
      })

      const result = await ayrshareService.createPost(profileKey, postData)
      
      expect(result.status).toBe('error')
      expect(result.message).toBe('Platform not connected')
    })
  })

  describe('Analytics Retrieval', () => {
    it('should get post analytics', async () => {
      const profileKey = 'profile-key-123'
      const postId = 'ayr-post-123'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: {
            facebook: {
              impressions: 1000,
              likes: 45,
              shares: 8,
              comments: 12,
              clicks: 25
            },
            instagram: {
              impressions: 800,
              likes: 67,
              shares: 5,
              comments: 18,
              clicks: 30
            }
          }
        })
      })

      const analytics = await ayrshareService.getPostAnalytics(profileKey, postId)
      
      expect(analytics).toHaveLength(2)
      expect(analytics[0].platform).toBe('facebook')
      expect(analytics[0].impressions).toBe(1000)
      expect(analytics[1].platform).toBe('instagram')
      expect(analytics[1].likes).toBe(67)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockUser: User = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpass',
        role: 'user',
        createdAt: new Date(),
        ayrshareProfileKey: null,
        ayrshareUserId: null,
        ayrshareRefId: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        lastLoginAt: null,
        isActive: true
      }

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await ayrshareService.createUserProfile(mockUser)
      
      expect(result.status).toBe('error')
      expect(result.message).toContain('Network error')
    })

    it('should handle invalid JSON responses', async () => {
      const profileKey = 'profile-key-123'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      const accounts = await ayrshareService.getUserSocialAccounts(profileKey)
      
      expect(accounts).toHaveLength(0)
    })
  })
})