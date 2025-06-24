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
      console.log('\n✅ Admin user already exists!');
      
      // Check if the admin has a username for our login system
      const adminUser = existingUsers.users.find(user => user.user_metadata?.role === 'admin');
      
      if (!adminUser.user_metadata?.username) {
        console.log('🔧 Adding username to existing admin for login system...');
        
        // Update the admin user with a username
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          adminUser.id,
          {
            user_metadata: {
              ...adminUser.user_metadata,
              username: 'admin'
            }
          }
        );
        
        if (updateError) {
          console.error('❌ Error updating admin user:', updateError.message);
          return;
        }
        
        console.log('✅ Admin user updated with username!');
      }
      
      console.log('\n🎉 Ready to test! Login with:');
      console.log('   Username: admin');
      console.log('   Password: [use the existing password]');
      console.log('\n📝 Or login with email:');
      console.log('   Email: futret@gmail.com');
      console.log('   Password: [your existing password]');
      return;
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