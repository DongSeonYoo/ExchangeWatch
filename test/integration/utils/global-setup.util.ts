import { TestFixtureUtil } from './integrate-test-fixture.util';

module.exports = async () => {
  const fixture = TestFixtureUtil.getInstance();
  await fixture.setUp(); // Prisma, Redis 연결
  await fixture.resetAll(); // 혹시 모를 이전 데이터 제거
  await fixture.createTestUser(); // 기본 유저 2명 생성
};
