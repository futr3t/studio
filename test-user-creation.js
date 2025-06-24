// Test user creation API endpoint
require('dotenv').config({ path: '.env.local' });

async function testCreateUser() {
  console.log('🔧 Testing User Creation API...\n');

  try {
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        username: 'teststaff',
        password: 'testpass123',
        userData: {
          name: 'Test Staff User',
          role: 'staff'
        }
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed JSON:', data);
      } catch (e) {
        console.log('Failed to parse as JSON:', e.message);
      }
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testCreateUser();