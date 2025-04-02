import { TestFixtureUtil } from './integrate-test-fixture.util';

module.exports = async () => {
  const fixture = TestFixtureUtil.getInstance();
  await fixture.resetAll();
  await fixture.tearDown();
};
