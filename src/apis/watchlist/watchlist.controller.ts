import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { ApiTags } from '@nestjs/swagger';
import { AccessAuth } from '../../decorators/swaggers/login-auth.decorator';
import {
  AddWatchlistItemReqDto,
  AddWatchlistItemResDto,
} from './dto/add-watchlist-item.dto';
import { LoggedInUser } from '../users/decorator/logged-in-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { ApiSuccess } from '../../decorators/swaggers/success.decorator';
import { ApiExceptions } from '../../decorators/swaggers/exception.decorator';
import { AlreadyRegisterPairException } from './exceptions/already-register-pair.excepetion';
import { MaximumPairException } from './exceptions/maximum-pair.exception';
import { InvalidCurrencyCodeException } from '../../decorators/validations/is-valid-currency.validator';
import {
  SelectWatchListReqDto,
  SelectWatchListResDto,
} from './dto/select-watchlis.dto';

@ApiTags('WatchList')
@AccessAuth()
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  /**
   * 관심 통화 등록
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiSuccess(AddWatchlistItemResDto)
  @ApiExceptions(
    {
      exampleTitle: '이미 등록된 통화쌍 일때',
      schema: AlreadyRegisterPairException,
    },
    {
      exampleTitle: '통화쌍이 최대개수일때',
      schema: MaximumPairException,
    },
    {
      exampleTitle: '올바르지 않은 통화 코드일 경우',
      schema: InvalidCurrencyCodeException,
    },
  )
  async registerInterestCurrency(
    @Body() dto: AddWatchlistItemReqDto,
    @LoggedInUser() user: UserEntity,
  ) {
    const item = await this.watchlistService.createInterestCurrency(
      user.idx,
      dto,
    );

    return AddWatchlistItemResDto.from(item);
  }

  /**
   * 관심 통화 목록 조회
   */
  @Get()
  @ApiSuccess(SelectWatchListResDto)
  async getInterestCurrencyList(
    @Query() dto: SelectWatchListReqDto,
    @LoggedInUser() user: UserEntity,
  ) {
    const { items, nextCursor } =
      await this.watchlistService.getInterestCurrencyList(user.idx, dto);
    nextCursor;

    return SelectWatchListResDto.of(items, nextCursor);
  }

  /**
   * 관심 통화 삭제
   */
  @Delete(':idx')
  async deleteInterstCurrency() {}

  /**
   * 순서 변경
   */
  @Patch('order')
  async changeCurrencyOrder() {}
}
