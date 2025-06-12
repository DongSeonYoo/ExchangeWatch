import { execSync } from 'child_process';
import { join } from 'path';

const backendDir = join(__dirname, '../..');

module.exports = async () => {
  console.log('🧹 [Global Teardown] Stopping docker containers...');
  execSync(
    `docker-compose -f ${join(backendDir, 'docker-compose-test.yml')} down`,
    {
      stdio: 'inherit',
      cwd: backendDir,
    },
  );
};
