import { execSync } from 'child_process';

module.exports = async () => {
  console.log('🧹 [Global Teardown] Stopping docker containers...');
  execSync('docker-compose -f docker-compose-test.yml down', {
    stdio: 'inherit',
  });
};
