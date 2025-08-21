// Mock server for testing API endpoints
interface MockRequest {
  json(): Promise<any>
  headers: { get(name: string): string | null }
}

// Mock API handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    
    if (body.email === 'admin@example.com' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          username: 'admin',
          role: 'admin',
          ayrshareProfileKey: 'profile-key-123'
        },
        token: 'mock-jwt-token'
      })
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (authHeader?.includes('mock-jwt-token')) {
      return HttpResponse.json({
        id: 'user-1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'admin',
        socialAccounts: [
          {
            id: 'account-1',
            platform: 'facebook',
            accountName: 'Test Facebook Page',
            status: 'connected'
          }
        ]
      })
    }
    
    return HttpResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }),

  // Social accounts endpoints
  http.get('/api/social-accounts', () => {
    return HttpResponse.json([
      {
        id: 'account-1',
        userId: 'user-1',
        platform: 'facebook',
        accountName: 'Test Facebook Page',
        accountHandle: '@testpage',
        status: 'connected',
        followerCount: 1250,
        verifiedAccount: false
      },
      {
        id: 'account-2',
        userId: 'user-1',
        platform: 'instagram',
        accountName: 'Test Instagram',
        accountHandle: '@testinsta',
        status: 'connected',
        followerCount: 850,
        verifiedAccount: true
      }
    ])
  }),

  http.post('/api/social-accounts/connect', () => {
    return HttpResponse.json({
      authUrl: 'https://test-oauth.example.com/facebook',
      state: 'test-state-123',
      platform: 'facebook',
      message: 'OAuth flow initiated'
    })
  }),

  // Posts endpoints
  http.get('/api/posts', () => {
    return HttpResponse.json([
      {
        id: 'post-1',
        userId: 'user-1',
        content: 'Test post content',
        platforms: ['facebook', 'instagram'],
        status: 'published',
        publishedAt: new Date('2024-01-15T10:00:00Z'),
        createdAt: new Date('2024-01-15T09:30:00Z')
      }
    ])
  }),

  http.post('/api/posts', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json({
      id: 'post-new',
      userId: 'user-1',
      ...body,
      status: body.scheduledAt ? 'scheduled' : 'published',
      createdAt: new Date(),
      publishedAt: body.scheduledAt ? null : new Date()
    })
  }),

  // Analytics endpoints
  http.get('/api/analytics', () => {
    return HttpResponse.json({
      totalPosts: 15,
      totalImpressions: 25000,
      totalLikes: 450,
      totalShares: 89,
      totalComments: 125,
      totalClicks: 320,
      averageEngagementRate: 285,
      analytics: [
        {
          id: 'analytics-1',
          postId: 'post-1',
          platform: 'facebook',
          impressions: 1200,
          likes: 45,
          shares: 8,
          comments: 12,
          clicks: 25,
          engagementRate: 350
        }
      ]
    })
  }),

  http.get('/api/dashboard/summary', () => {
    return HttpResponse.json({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'admin'
      },
      stats: {
        connectedAccounts: 2,
        totalPosts: 15,
        scheduledPosts: 3,
        recentEngagement: 125
      },
      recentPosts: [],
      socialAccounts: [],
      analytics: {
        totalImpressions: 25000,
        totalEngagement: 660,
        averageEngagementRate: 285
      }
    })
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ayrshareConnected: false
    })
  })
]

export const server = setupServer(...handlers)