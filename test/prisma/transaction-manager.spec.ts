// import { Test, TestingModule } from '@nestjs/testing';
// import { TransactionManager } from 'src/prisma/prisma-transaction.manager';
// import { PrismaService } from 'src/prisma/prisma.service';

// describe('TransactionManager Test', () => {
//   let transactionManager: TransactionManager;
//   let prismaService: PrismaService;

//   beforeAll(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [TransactionManager, PrismaService],
//     }).compile();

//     transactionManager = module.get<TransactionManager>(TransactionManager);
//     prismaService = module.get<PrismaService>(PrismaService);
//   });

//   afterAll(async () => {
//     await prismaService.$transaction([
//       prismaService.parent.deleteMany(),
//       prismaService.student.deleteMany(),
//     ]);

//     await prismaService.$disconnect();
//   });

//   afterEach(async () => {
//     await prismaService.$transaction([
//       prismaService.parent.deleteMany(),
//       prismaService.student.deleteMany(),
//     ]);
//   });

//   describe('runTransaction', () => {
//     describe('일반 트랜잭션에 대해서 테스트한다', () => {
//       it('모든 트랜잭션이 성공할 경우 모든 데이터가 저장된다', async () => {
//         // given
//         const studentSeed = studentSeedList[0];
//         const parentSeed = {
//           name: '홍길동 모',
//           phoneNumber: '01011111111',
//         };

//         // when
//         const createdStudentTx = await transactionManager.runTransaction(
//           async (tx) => {
//             const createStudent = await tx.student.create({
//               data: studentSeed,
//             });

//             await tx.parent.create({
//               data: {
//                 studentIdx: createStudent.idx,
//                 ...parentSeed,
//               },
//             });

//             return createStudent;
//           },
//         );

//         const [createdStudent, createdParent] = await Promise.all([
//           prismaService.student.findUniqueOrThrow({
//             where: {
//               idx: createdStudentTx.idx,
//             },
//           }),
//           prismaService.parent.findFirstOrThrow({
//             where: {
//               studentIdx: createdStudentTx.idx,
//             },
//           }),
//         ]);

//         // then
//         expect(studentSeed.email).toBe(createdStudent.email);
//         expect(studentSeed.birthDate).toStrictEqual(createdStudent.birthDate);
//         expect(createdStudent.idx).toBe(createdParent.studentIdx);
//       });

//       it('만약 한 작업이 끝난 후, 에러가 발생하면 에러가 발생하기 이전 작업은 롤백된다', async () => {
//         // given
//         const studentSeed = studentSeedList[0];
//         const parentSeed = {
//           name: '홍길동 모',
//           phoneNumber: '01011111111',
//         };

//         // when
//         const act = async () =>
//           await transactionManager.runTransaction(async (tx) => {
//             const createdStudent = await tx.student.create({
//               data: studentSeed,
//             });

//             throw new Error('예상치못한 에러');

//             await tx.parent.create({
//               data: {
//                 studentIdx: createdStudent.idx,
//                 ...parentSeed,
//               },
//             });
//           });
//         const [foundStudent, foundParent] = await Promise.all([
//           prismaService.student.findFirst({
//             where: {
//               idx: studentSeed.idx,
//             },
//           }),
//           prismaService.parent.findFirst({
//             where: {
//               studentIdx: studentSeed.idx,
//             },
//           }),
//         ]);

//         // then
//         await expect(act).rejects.toThrow('예상치못한 에러');
//         expect(foundStudent).toBeNull();
//         expect(foundParent).toBeNull;
//       });
//     });

//     describe('중첩 트랜잭션에 대해서 테스트한다', () => {
//       it('중첩 트랜잭션이 모두 성공하면 모든 데이터가 저장된다', async () => {
//         // given
//         const outerStudentSeed = studentSeedList[0];
//         const innerStudentSeed = studentSeedList[1];

//         // when
//         await transactionManager.runTransaction(async (outerTx) => {
//           await outerTx.student.create({ data: outerStudentSeed });

//           await transactionManager.runTransaction(async (innerTx) => {
//             await innerTx.student.create({ data: innerStudentSeed });
//           });
//         });
//         const studentList = await prismaService.student.findMany();

//         // then
//         expect(studentList).toHaveLength(2);
//         expect(outerStudentSeed.idx).toBe(studentList[0].idx);
//         expect(innerStudentSeed.idx).toBe(studentList[1].idx);
//       });

//       it('내부 트랜잭션이 실패하면 외부 트랜잭션도 롤백된다', async () => {
//         // given
//         const outerStudentSeed = studentSeedList[0];
//         const innerStudentSeed = studentSeedList[1];

//         // when
//         const act = async () =>
//           await transactionManager.runTransaction(async (outerTx) => {
//             await outerTx.student.create({ data: outerStudentSeed });

//             await transactionManager.runTransaction(async (innerTx) => {
//               await innerTx.student.create({ data: innerStudentSeed });

//               throw new Error('Error in Inner Transaction');
//             });
//           });

//         const studentList = await prismaService.student.findUnique({
//           where: {
//             idx: outerStudentSeed.idx,
//           },
//         });

//         // then
//         await expect(act).rejects.toThrow('Error in Inner Transaction');
//         expect(studentList).toBeNull();
//       });

//       it('내부 트랜잭션은 성공하고 외부 트랜잭션이 실패하면 모두 롤백된다', async () => {
//         // given
//         const outerStudentSeed = studentSeedList[0];
//         const innerStudentSeed = studentSeedList[1];

//         // when
//         const act = async () =>
//           await transactionManager.runTransaction(async (outerTx) => {
//             await outerTx.student.create({ data: outerStudentSeed });

//             await transactionManager.runTransaction(async (innerTx) => {
//               await innerTx.student.create({ data: innerStudentSeed });
//             });

//             throw new Error('Error in Outer Transaction');
//           });

//         const studentList = await prismaService.student.findUnique({
//           where: {
//             idx: innerStudentSeed.idx,
//           },
//         });

//         // then
//         await expect(act).rejects.toThrow('Error in Outer Transaction');
//         expect(studentList).toBeNull();
//       });
//     });
//   });
// });
