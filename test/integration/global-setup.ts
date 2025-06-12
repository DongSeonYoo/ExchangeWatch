import { config } from 'dotenv';
import { execSync } from 'child_process';
import { join } from 'path';

const backendDir = join(__dirname, '../..');
const envPath = join(backendDir, '.env.test');

config({ path: envPath });

module.exports = async () => {
  console.log('✅ [Global Setup] Starting docker containers...');
  execSync(
    `docker-compose -f ${join(backendDir, 'docker-compose-test.yml')} up -d`,
    {
      stdio: 'inherit',
      cwd: backendDir,
    },
  );

  console.log('✅ [Global Setup] Running prisma migrate reset...');
  execSync(
    `npx prisma migrate reset --force --schema=${join(backendDir, 'prisma/schema.prisma')}`,
    {
      stdio: 'inherit',
      cwd: backendDir,
    },
  );

  console.log('✅ [Global Setup] Done.');
};
