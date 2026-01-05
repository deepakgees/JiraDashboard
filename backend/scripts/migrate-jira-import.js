#!/usr/bin/env node

/**
 * Migration script for Jira Import functionality
 * This script applies the database schema changes for Jira import tables
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Jira Import Database Migration...\n');

try {
  // Change to backend directory
  process.chdir(path.join(__dirname, '..'));
  
  console.log('📋 Generating Prisma client...');
  execSync('npm run db:generate', { stdio: 'inherit' });
  
  console.log('\n🗄️  Pushing database schema changes...');
  execSync('npm run db:push', { stdio: 'inherit' });
  
  console.log('\n✅ Migration completed successfully!');
  console.log('\n📊 New tables created:');
  console.log('   - import_configs');
  console.log('   - jira_epics');
  console.log('   - jira_issues');
  console.log('   - import_logs');
  
  console.log('\n🔗 New API endpoints available:');
  console.log('   - POST /api/import/start');
  console.log('   - POST /api/import/test-connection');
  console.log('   - GET /api/import/history');
  console.log('   - GET /api/import/epics');
  console.log('   - GET /api/import/issues');
  console.log('   - GET /api/config/teams');
  console.log('   - GET /api/config/statistics');
  
  console.log('\n📖 For detailed documentation, see: backend/JIRA_IMPORT_README.md');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\n🔧 Troubleshooting:');
  console.error('   1. Ensure PostgreSQL is running');
  console.error('   2. Check DATABASE_URL in .env file');
  console.error('   3. Verify database connection');
  console.error('   4. Check Prisma schema syntax');
  
  process.exit(1);
}
