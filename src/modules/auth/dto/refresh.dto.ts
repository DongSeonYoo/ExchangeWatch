import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshAcessTokenReqDto {
  /**
   * 리프레시 토큰
   */
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
