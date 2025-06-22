import { config } from 'dotenv';
import { execSync } from 'child_process';
import { join } from 'path';

const backendDir = join(__dirname, '../..');
const envPath = join(backendDir, '.env.test');

config({ path: envPath });

module.exports = async () => {
  console.log('✅ [Global Setup] Using existing development containers...');
  console.log('✅ [Global Setup] Running prisma migrate reset...');
  execSync(
    `npx prisma migrate reset --force --schema=${join(backendDir, 'prisma', 'schema.prisma')}`,
  );

  console.log('✅ [Global Setup] Done.');
};
