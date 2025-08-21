// Frontend Debugging Script
import fetch from 'node:fetch'

const BASE_URL = 'http://localhost:5000'

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

async function checkFrontendAssets() {
  log('Checking frontend assets and routes...')
  
  try {
    // Check if main page loads
    const mainPageResponse = await fetch(BASE_URL)
    log(`Main page status: ${mainPageResponse.status}`)
    
    if (mainPageResponse.status === 200) {
      const html = await mainPageResponse.text()
      log(`HTML length: ${html.length} characters`)
      
      // Check for React app mounting
      if (html.includes('id="root"')) {
        log('Found React root element ✓', 'success')
      } else {
        log('React root element not found', 'error')
      }
      
      // Check for Vite client
      if (html.includes('vite/client')) {
        log('Vite development client detected ✓', 'success')
      } else {
        log('Vite client not found', 'error')
      }
    }
    
    // Check API routes are working
    const apiHealthResponse = await fetch(`${BASE_URL}/api/health`)
    if (apiHealthResponse.status === 200) {
      const healthData = await apiHealthResponse.json()
      log(`API health check: ${healthData.status} ✓`, 'success')
      log(`Ayrshare connected: ${healthData.ayrshareConnected}`)
    }
    
    // Check static assets
    const assetsToCheck = [
      '/src/main.tsx',
      '/src/App.tsx',
      '/src/index.css'
    ]
    
    for (const asset of assetsToCheck) {
      try {
        const assetResponse = await fetch(`${BASE_URL}${asset}`)
        log(`Asset ${asset}: ${assetResponse.status === 200 ? '✓' : '✗'} (${assetResponse.status})`)
      } catch (error) {
        log(`Asset ${asset}: Error - ${error.message}`, 'error')
      }
    }
    
  } catch (error) {
    log(`Frontend check failed: ${error.message}`, 'error')
  }
}

// Check browser console errors by making a request to a non-existent endpoint
async function checkErrorHandling() {
  log('Checking error handling...')
  
  try {
    const notFoundResponse = await fetch(`${BASE_URL}/api/nonexistent`)
    log(`404 handling: ${notFoundResponse.status === 404 ? '✓' : '✗'} (${notFoundResponse.status})`)
    
    const badJsonResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    })
    log(`Bad JSON handling: ${badJsonResponse.status >= 400 ? '✓' : '✗'} (${badJsonResponse.status})`)
    
  } catch (error) {
    log(`Error handling check failed: ${error.message}`, 'error')
  }
}

async function runFrontendDebugging() {
  log('Starting frontend debugging...')
  
  await checkFrontendAssets()
  await checkErrorHandling()
  
  log('Frontend debugging complete!')
}

runFrontendDebugging().catch(error => {
  log(`Frontend debugging failed: ${error.message}`, 'error')
  console.error(error)
})