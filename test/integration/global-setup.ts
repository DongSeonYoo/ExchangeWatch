import { config } from 'dotenv';
import { execSync } from 'child_process';
config({ path: '.env.test' });

module.exports = async () => {
  console.log('✅ [Global Setup] Starting docker containers...');
  execSync('docker-compose -f docker-compose-test.yml up -d', {
    stdio: 'inherit',
  });

  console.log('✅ [Global Setup] Running prisma migrate reset...');
  execSync('npx prisma migrate reset --force', { stdio: 'inherit' });

  console.log('✅ [Global Setup] Done.');
};
