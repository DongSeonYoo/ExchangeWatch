import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserRequestDto } from './dtos/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { TransactionManager } from 'src/prisma/prisma-transaction.manager';
import { UserEmailExistsException } from './exceptions/user-email-exists.exception';
import { UpdateUserRequestDto } from './dtos/update-user.dto';
import { UserNotFoundException } from './exceptions/user-not-found.exception';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * 회원 가입
   *
   * - 이메일 중복 체크
   * - dto를 UserEntity로 변환한 후, repository 레이어에 넘겨준다
   * - 다른 트랜잭션이 존재한다면 transactionManager 내에서 tx를 넘겨주며 로직들을 실행한다
   * - repository로부터 도메인 엔티티로 변환된 UserEntity를 반환한다.
   */
  async createUser(dto: CreateUserRequestDto): Promise<UserEntity> {
    // 이메일 중복 체크
    const checkDuplicateEmail = await this.userRepository.checkDuplicateEmail(
      dto.email,
    );
    if (checkDuplicateEmail) {
      throw new UserEmailExistsException();
    }

    // dto를 UserEntity로 변환
    const userEntity = dto.toEntity();

    // 트랜잭션 시작
    const txResult = this.transactionManager.runTransaction(async (tx) => {
      const createdUser = await this.userRepository.createUser(userEntity, tx);

      // another transactions...

      return createdUser;
    });

    // 트랜잭션 결과 반환
    return txResult;
  }

  /**
   * 유저 정보 수정
   *
   * - 해당 유저가 존재하는지 체크
   * - 중복된 이메일이 존재하는지 체크
   * - dto를 UserEntity로 변환한 후, repository 레이어에 넘겨준다
   * - 다른 트랜잭션이 존재한다면 transactionManager 내에서 tx를 넘겨주며 로직들을 실행한다
   */
  async updateUser(
    userIdx: number,
    dto: UpdateUserRequestDto,
  ): Promise<UserEntity> {
    // 해당 유저가 존재하는지 체크
    await this.checkExistStudent(userIdx);

    // 이메일 중복 체크
    if (dto.email) {
      const checkDuplicateEmail = await this.userRepository.checkDuplicateEmail(
        dto.email,
      );
      if (checkDuplicateEmail) {
        throw new UserEmailExistsException();
      }
    }

    // dto를 UserEntity로 변환
    const userEntity = dto.toEntity();

    const txResult = await this.transactionManager.runTransaction(
      async (tx) => {
        const updatedUser = await this.userRepository.updateUser(
          userIdx,
          userEntity,
          tx,
        );

        // another transactions...
        return updatedUser;
      },
    );

    return txResult;
  }

  /**
   * 유저 정보가 존재하는지 확인
   *
   * - 해당 유저가 존재하지 않으면 UserNotFoundException을 발생시킨다
   * - 존재한다면 해당 유저 정보를 반환한다
   */
  async checkExistStudent(userIdx: number): Promise<UserEntity> {
    const findUserEntity = await this.userRepository.findUserByIdx(userIdx);
    if (!findUserEntity) {
      throw new UserNotFoundException();
    }

    return findUserEntity;
  }
}
