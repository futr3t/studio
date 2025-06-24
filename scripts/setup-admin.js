#!/usr/bin/env node

// Setup script to create the master admin user
// Run with: node scripts/setup-admin.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAdmin() {
  console.log('🔧 ChefCheck Master Admin Setup');
  console.log('================================\n');

  try {
    // Get admin details
    const name = await question('Enter admin full name: ');
    const username = await question('Enter admin username: ');
    const password = await question('Enter admin password (min 6 chars): ');

    if (!name || !username || !password) {
      console.error('❌ All fields are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    console.log('\n🚀 Creating master admin...');

    // Make API call to create admin
    const response = await fetch('http://localhost:9002/api/setup/create-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'setup-key': 'chefcheck_initial_setup_2024'
      },
      body: JSON.stringify({
        name,
        username,
        password
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Setup failed:', result.error);
      process.exit(1);
    }

    console.log('✅ Master admin created successfully!');
    console.log(`\n📝 Admin Details:`);
    console.log(`   Name: ${result.name}`);
    console.log(`   Username: ${result.username}`);
    console.log(`   User ID: ${result.user_id}`);
    console.log('\n🎉 You can now login to ChefCheck with these credentials');
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Check if server is running
fetch('http://localhost:9002/api/setup/create-admin', {
  method: 'OPTIONS'
}).then(() => {
  setupAdmin();
}).catch(() => {
  console.error('❌ ChefCheck server is not running!');
  console.log('Please start the server first with: npm run dev');
  process.exit(1);
});