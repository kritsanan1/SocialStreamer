// OAuth Flow Debugging Script
console.log('🔍 Debugging OAuth flow...\n')

// Test JWT token parsing
const testToken = 'jwt_eyJ1c2VySWQiOiI0MmQ5NjY2Mi0wNGU1LTRkNTUtYWQxMi01NDc5Y2FmZTNmNzYifQ==_1755777615704'

try {
  console.log('Testing JWT token:', testToken)
  
  // Extract payload
  const tokenParts = testToken.split('_')
  console.log('Token parts:', tokenParts.length)
  
  if (tokenParts.length >= 2) {
    const payload = JSON.parse(atob(tokenParts[1]))
    console.log('Decoded payload:', payload)
    console.log('User ID from token:', payload.userId)
  }
} catch (error) {
  console.error('JWT parsing error:', error.message)
}

console.log('\n📝 OAuth Flow Analysis:')
console.log('1. Token format: Mock JWT implementation')
console.log('2. User lookup: Need to check storage method')
console.log('3. Error occurred at: getUser() call in social connect endpoint')

console.log('\n🔧 Next steps:')
console.log('- Verify storage.getUser() method works correctly')  
console.log('- Check if user ID exists in memory storage')
console.log('- Add more detailed logging to trace the issue')