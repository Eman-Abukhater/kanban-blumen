// Quick connection test script
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('\n🔍 Testing Database Connection...\n');
  
  const startTime = Date.now();
  
  try {
    // Test connection
    await prisma.$connect();
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Database connected successfully in ${connectionTime}ms`);
    
    // Test query
    const queryStart = Date.now();
    const userCount = await prisma.user.count();
    const queryTime = Date.now() - queryStart;
    
    console.log(`✅ Query executed in ${queryTime}ms`);
    console.log(`📊 Found ${userCount} users in database\n`);
    
    // Performance analysis
    if (queryTime < 50) {
      console.log('🚀 EXCELLENT: Query speed is optimal!');
    } else if (queryTime < 150) {
      console.log('✅ GOOD: Query speed is acceptable');
    } else if (queryTime < 500) {
      console.log('⚠️  SLOW: Query taking too long (check connection pooler)');
    } else {
      console.log('❌ VERY SLOW: Likely using Transaction Pooler (port 6543)');
      console.log('   → Switch to Session Pooler (port 5432)');
    }
    
    console.log('\n📋 Connection Info:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
    console.log(`   Using pooler: ${process.env.DATABASE_URL?.includes('pooler') ? 'Yes' : 'No'}`);
    console.log(`   Port: ${process.env.DATABASE_URL?.match(/:(\d+)\//)?.[1] || 'unknown'}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check DATABASE_URL in .env file');
    console.error('   2. Ensure using Session Pooler (port 5432, NOT 6543)');
    console.error('   3. Verify Supabase project is not paused');
    console.error('   4. Check network connectivity\n');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

