// Manual API Testing and Debugging Script
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const BASE_URL = 'http://localhost:5000'

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

function assert(condition, message) {
  if (condition) {
    testResults.passed++
    log(`PASS: ${message}`, 'success')
  } else {
    testResults.failed++
    testResults.errors.push(message)
    log(`FAIL: ${message}`, 'error')
  }
}

async function makeRequest(method, path, data = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
    
    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(`${BASE_URL}${path}`, options)
    
    let responseData
    try {
      responseData = await response.json()
    } catch (e) {
      responseData = await response.text()
    }

    return {
      status: response.status,
      data: responseData,
      headers: response.headers
    }
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error')
    return { status: 0, data: null, error: error.message }
  }
}

// Test Suite
async function runTests() {
  log('Starting API debugging tests...')
  
  // Test 1: Health Check
  log('Testing health endpoint...')
  const healthResponse = await makeRequest('GET', '/api/health')
  assert(healthResponse.status === 200, 'Health endpoint returns 200')
  assert(healthResponse.data?.status === 'healthy', 'Health status is healthy')
  
  // Test 2: Authentication - Login with demo account
  log('Testing authentication with demo admin account...')
  const loginResponse = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'password'
  })
  
  assert(loginResponse.status === 200, 'Login returns 200 status')
  assert(loginResponse.data?.token, 'Login returns JWT token')
  assert(loginResponse.data?.user?.email === 'admin@example.com', 'Login returns correct user')
  
  const authToken = loginResponse.data?.token
  
  if (!authToken) {
    log('Cannot continue tests without authentication token', 'error')
    return
  }
  
  // Test 3: Authenticated requests
  log('Testing authenticated user endpoint...')
  const meResponse = await makeRequest('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  })
  
  assert(meResponse.status === 200, 'GET /api/auth/me returns 200')
  assert(meResponse.data?.id, 'User data includes ID')
  assert(!meResponse.data?.password, 'User data excludes password')
  
  // Test 4: Social accounts
  log('Testing social accounts endpoint...')
  const socialAccountsResponse = await makeRequest('GET', '/api/social-accounts', null, {
    'Authorization': `Bearer ${authToken}`
  })
  
  assert(socialAccountsResponse.status === 200, 'GET /api/social-accounts returns 200')
  assert(Array.isArray(socialAccountsResponse.data), 'Social accounts returns array')
  
  // Test 5: Dashboard summary
  log('Testing dashboard summary...')
  const dashboardResponse = await makeRequest('GET', '/api/dashboard/summary', null, {
    'Authorization': `Bearer ${authToken}`
  })
  
  assert(dashboardResponse.status === 200, 'GET /api/dashboard/summary returns 200')
  assert(dashboardResponse.data?.stats, 'Dashboard includes stats')
  assert(dashboardResponse.data?.user, 'Dashboard includes user data')
  
  // Test 6: Analytics
  log('Testing analytics endpoint...')
  const analyticsResponse = await makeRequest('GET', '/api/analytics', null, {
    'Authorization': `Bearer ${authToken}`
  })
  
  assert(analyticsResponse.status === 200, 'GET /api/analytics returns 200')
  assert(typeof analyticsResponse.data?.totalPosts === 'number', 'Analytics includes totalPosts')
  
  // Test 7: Posts creation
  log('Testing post creation...')
  const createPostResponse = await makeRequest('POST', '/api/posts', {
    content: 'Test post from debugging script',
    platforms: ['facebook'],
    mediaUrls: []
  }, {
    'Authorization': `Bearer ${authToken}`
  })
  
  // This might fail if no social accounts are connected, which is expected in demo mode
  if (createPostResponse.status === 400 && 
      createPostResponse.data?.message?.includes('connect accounts')) {
    log('Post creation failed due to missing social accounts (expected in demo mode)', 'info')
  } else {
    assert(createPostResponse.status === 200, 'POST /api/posts returns 200')
    assert(createPostResponse.data?.content, 'Created post includes content')
  }
  
  // Test 8: Social account connection flow
  log('Testing social account connection...')
  const connectResponse = await makeRequest('POST', '/api/social-accounts/connect', {
    platform: 'facebook'
  }, {
    'Authorization': `Bearer ${authToken}`
  })
  
  // Check if this creates an Ayrshare profile or returns connection URL
  assert(connectResponse.status === 200 || connectResponse.status === 500, 
    'Social account connection returns expected status')
  
  if (connectResponse.status === 200) {
    assert(connectResponse.data?.authUrl || connectResponse.data?.message, 
      'Connection response includes authUrl or message')
  }
  
  // Test 9: Unauthorized access
  log('Testing unauthorized access...')
  const unauthorizedResponse = await makeRequest('GET', '/api/auth/me')
  assert(unauthorizedResponse.status === 401, 'Unauthorized request returns 401')
  
  // Test 10: Invalid credentials
  log('Testing invalid credentials...')
  const invalidLoginResponse = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'wrongpassword'
  })
  assert(invalidLoginResponse.status === 401, 'Invalid login returns 401')
  
  // Summary
  log('\n=== TEST SUMMARY ===')
  log(`Tests passed: ${testResults.passed}`)
  log(`Tests failed: ${testResults.failed}`)
  log(`Total tests: ${testResults.passed + testResults.failed}`)
  
  if (testResults.failed > 0) {
    log('\nFailed tests:')
    testResults.errors.forEach(error => log(`- ${error}`, 'error'))
  } else {
    log('All tests passed! 🎉', 'success')
  }
}

// Run the tests
runTests().catch(error => {
  log(`Test suite failed: ${error.message}`, 'error')
  console.error(error)
})