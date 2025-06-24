// Test Supabase admin user creation
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createAdminUser() {
  console.log('🔧 Testing Supabase Admin User Creation...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Check if admin already exists
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error('❌ Error checking existing users:', checkError.message);
      return;
    }

    console.log('📋 All existing users:');
    existingUsers.users.forEach(user => {
      console.log(`   - ${user.user_metadata?.name || 'Unknown'} (${user.email}) - Role: ${user.user_metadata?.role || 'None'}`);
      if (user.user_metadata?.username) {
        console.log(`     Username: ${user.user_metadata.username}`);
      }
    });

    const adminExists = existingUsers.users.some(
      user => user.user_metadata?.role === 'admin'
    );

    if (adminExists) {
      console.log('\n🗑️ Removing existing admin user...');
      
      const adminUser = existingUsers.users.find(user => user.user_metadata?.role === 'admin');
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(adminUser.id);
      
      if (deleteError) {
        console.error('❌ Error deleting admin user:', deleteError.message);
        return;
      }
      
      console.log('✅ Existing admin user deleted!');
    }

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@chefcheck.local',
      password: 'admin123',
      user_metadata: {
        name: 'Restaurant Administrator',
        role: 'admin',
        username: 'admin',
      },
      email_confirm: true,
    });

    if (error) {
      console.error('❌ Error creating admin user:', error.message);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📝 Admin Details:');
    console.log(`   Name: ${data.user.user_metadata.name}`);
    console.log(`   Username: ${data.user.user_metadata.username}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Role: ${data.user.user_metadata.role}`);
    console.log(`   User ID: ${data.user.id}`);
    console.log('\n🎉 You can now login with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createAdminUser();