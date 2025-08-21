// OAuth Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OAuthService } from '../../server/oauth'
import { MemStorage } from '../../server/storage'
import type { User } from '../../shared/schema'

// Mock the ayrshare service
vi.mock('../../server/ayrshare', () => ({
  ayrshareService: {
    generateJWT: vi.fn(),
    getUserSocialAccounts: vi.fn(),
    disconnectSocialAccount: vi.fn()
  }
}))

describe('OAuthService', () => {
  let oauthService: OAuthService
  let storage: MemStorage
  let mockUser: User

  beforeEach(() => {
    oauthService = new OAuthService()
    storage = new MemStorage()
    
    mockUser = {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpass',
      role: 'user',
      createdAt: new Date(),
      ayrshareProfileKey: 'profile-key-123',
      ayrshareUserId: 'ayr-user-456',
      ayrshareRefId: 'ref-789',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      lastLoginAt: null,
      isActive: true
    }

    vi.clearAllMocks()
  })

  describe('OAuth Flow Initiation', () => {
    it('should start OAuth flow successfully', async () => {
      const { ayrshareService } = await import('../../server/ayrshare')
      
      vi.mocked(ayrshareService.generateJWT).mockResolvedValueOnce({
        status: 'success',
        url: 'https://profile.ayrshare.com?jwt=mock-jwt&redirect=callback',
        jwt: 'mock-jwt-token',
        message: 'JWT generated successfully'
      })

      const result = await oauthService.startOAuthFlow(mockUser, 'facebook')
      
      expect(result.authUrl).toContain('profile.ayrshare.com')
      expect(result.state).toBeDefined()
      expect(result.state).toHaveLength(64) // crypto.randomBytes(32).toString('hex')
      
      expect(ayrshareService.generateJWT).toHaveBeenCalledWith(
        'profile-key-123',
        expect.stringContaining('/api/oauth/callback/facebook')
      )
    })

    it('should throw error if user has no Ayrshare profile', async () => {
      const userWithoutProfile = { ...mockUser, ayrshareProfileKey: null }
      
      await expect(
        oauthService.startOAuthFlow(userWithoutProfile, 'facebook')
      ).rejects.toThrow('User does not have an Ayrshare profile')
    })

    it('should handle Ayrshare JWT generation failure', async () => {
      const { ayrshareService } = await import('../../server/ayrshare')
      
      vi.mocked(ayrshareService.generateJWT).mockResolvedValueOnce({
        status: 'error',
        url: null,
        jwt: null,
        message: 'Failed to generate JWT'
      })

      await expect(
        oauthService.startOAuthFlow(mockUser, 'facebook')
      ).rejects.toThrow('Failed to generate Ayrshare linking URL')
    })
  })

  describe('OAuth Callback Handling', () => {
    it('should handle successful OAuth callback', async () => {
      // First create an OAuth session
      const session = await storage.createOAuthSession({
        userId: mockUser.id,
        platform: 'facebook',
        state: 'test-state-123',
        codeVerifier: 'test-verifier',
        redirectUri: 'http://localhost:5000/callback',
        scope: 'pages_manage_posts',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      })

      // Mock storage methods
      const getOAuthSessionByState = vi.spyOn(storage, 'getOAuthSessionByState')
        .mockResolvedValueOnce(session)
      const getUser = vi.spyOn(storage, 'getUser')
        .mockResolvedValueOnce(mockUser)
      const deleteOAuthSession = vi.spyOn(storage, 'deleteOAuthSession')
        .mockResolvedValueOnce()

      // Mock sync method
      const syncSpy = vi.spyOn(oauthService, 'syncUserSocialAccounts')
        .mockResolvedValueOnce()

      const result = await oauthService.handleOAuthCallback(
        'facebook',
        'auth-code-123',
        'test-state-123'
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Successfully connected facebook')
      expect(result.userId).toBe(mockUser.id)

      expect(getOAuthSessionByState).toHaveBeenCalledWith('test-state-123')
      expect(syncSpy).toHaveBeenCalledWith(mockUser)
      expect(deleteOAuthSession).toHaveBeenCalledWith(session.id)
    })

    it('should handle invalid OAuth state', async () => {
      const getOAuthSessionByState = vi.spyOn(storage, 'getOAuthSessionByState')
        .mockResolvedValueOnce(undefined)

      const result = await oauthService.handleOAuthCallback(
        'facebook',
        'auth-code-123',
        'invalid-state'
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid OAuth state')
    })

    it('should handle expired OAuth session', async () => {
      const expiredSession = await storage.createOAuthSession({
        userId: mockUser.id,
        platform: 'facebook',
        state: 'expired-state',
        codeVerifier: 'test-verifier',
        redirectUri: 'http://localhost:5000/callback',
        scope: 'pages_manage_posts',
        expiresAt: new Date(Date.now() - 60 * 1000) // Expired 1 minute ago
      })

      const getOAuthSessionByState = vi.spyOn(storage, 'getOAuthSessionByState')
        .mockResolvedValueOnce(expiredSession)
      const deleteOAuthSession = vi.spyOn(storage, 'deleteOAuthSession')
        .mockResolvedValueOnce()

      const result = await oauthService.handleOAuthCallback(
        'facebook',
        'auth-code-123',
        'expired-state'
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('OAuth session expired')
      expect(deleteOAuthSession).toHaveBeenCalledWith(expiredSession.id)
    })
  })

  describe('Social Account Synchronization', () => {
    it('should sync social accounts from Ayrshare', async () => {
      const { ayrshareService } = await import('../../server/ayrshare')
      
      // Mock Ayrshare response
      const mockAyrshareAccounts = [
        {
          id: 'account-1',
          userId: mockUser.id,
          platform: 'facebook',
          accountId: 'fb-123',
          accountName: 'Test Facebook Page',
          accountHandle: '@testpage',
          avatar: 'https://example.com/avatar.jpg',
          status: 'connected' as const,
          ayrshareAccountId: 'ayr-fb-123',
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          connectionType: 'oauth' as const,
          followerCount: 1500,
          verifiedAccount: false,
          accountMetadata: {},
          lastSyncAt: new Date(),
          lastPostAt: null,
          createdAt: new Date()
        }
      ]

      vi.mocked(ayrshareService.getUserSocialAccounts).mockResolvedValueOnce(
        mockAyrshareAccounts
      )

      // Mock storage methods
      const getSocialAccountsByUserId = vi.spyOn(storage, 'getSocialAccountsByUserId')
        .mockResolvedValueOnce([])
      const createSocialAccount = vi.spyOn(storage, 'createSocialAccount')
        .mockResolvedValueOnce(mockAyrshareAccounts[0])

      await oauthService.syncUserSocialAccounts(mockUser)

      expect(ayrshareService.getUserSocialAccounts).toHaveBeenCalledWith('profile-key-123')
      expect(createSocialAccount).toHaveBeenCalledWith({
        ...mockAyrshareAccounts[0],
        userId: mockUser.id
      })
    })

    it('should update existing accounts during sync', async () => {
      const { ayrshareService } = await import('../../server/ayrshare')
      
      const existingAccount = {
        id: 'account-1',
        userId: mockUser.id,
        platform: 'facebook',
        accountId: 'fb-123',
        accountName: 'Old Facebook Page',
        accountHandle: '@oldpage',
        avatar: null,
        status: 'connected' as const,
        ayrshareAccountId: 'ayr-fb-123',
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        connectionType: 'oauth' as const,
        followerCount: 1000,
        verifiedAccount: false,
        accountMetadata: {},
        lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        lastPostAt: null,
        createdAt: new Date()
      }

      const updatedAyrshareAccount = {
        ...existingAccount,
        accountName: 'Updated Facebook Page',
        followerCount: 1500,
        verifiedAccount: true
      }

      vi.mocked(ayrshareService.getUserSocialAccounts).mockResolvedValueOnce([
        updatedAyrshareAccount
      ])

      const getSocialAccountsByUserId = vi.spyOn(storage, 'getSocialAccountsByUserId')
        .mockResolvedValueOnce([existingAccount])
      const updateSocialAccount = vi.spyOn(storage, 'updateSocialAccount')
        .mockResolvedValueOnce(updatedAyrshareAccount)

      await oauthService.syncUserSocialAccounts(mockUser)

      expect(updateSocialAccount).toHaveBeenCalledWith(existingAccount.id, {
        status: 'connected',
        accountName: 'Updated Facebook Page',
        accountHandle: '@oldpage',
        avatar: null,
        followerCount: 1500,
        verifiedAccount: true,
        accountMetadata: {},
        lastSyncAt: expect.any(Date)
      })
    })
  })

  describe('Account Disconnection', () => {
    it('should disconnect social account', async () => {
      const { ayrshareService } = await import('../../server/ayrshare')
      
      const existingAccount = {
        id: 'account-1',
        userId: mockUser.id,
        platform: 'facebook',
        accountId: 'fb-123',
        accountName: 'Test Facebook Page',
        accountHandle: '@testpage',
        avatar: null,
        status: 'connected' as const,
        ayrshareAccountId: 'ayr-fb-123',
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        connectionType: 'oauth' as const,
        followerCount: 1500,
        verifiedAccount: false,
        accountMetadata: {},
        lastSyncAt: new Date(),
        lastPostAt: null,
        createdAt: new Date()
      }

      vi.mocked(ayrshareService.disconnectSocialAccount).mockResolvedValueOnce()

      const getSocialAccountsByUserId = vi.spyOn(storage, 'getSocialAccountsByUserId')
        .mockResolvedValueOnce([existingAccount])
      const updateSocialAccount = vi.spyOn(storage, 'updateSocialAccount')
        .mockResolvedValueOnce({ ...existingAccount, status: 'disconnected' })

      await oauthService.disconnectAccount(mockUser, 'facebook')

      expect(ayrshareService.disconnectSocialAccount).toHaveBeenCalledWith(
        'profile-key-123',
        'facebook'
      )
      expect(updateSocialAccount).toHaveBeenCalledWith(existingAccount.id, {
        status: 'disconnected',
        lastSyncAt: expect.any(Date)
      })
    })
  })
})