import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateSubscribeDto } from './dto/exchange-rates-subscribe.dto';
import { WsExceptionFilter } from '../../filters/ws-exception.filter';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { LoggedInUser } from '../users/decorator/logged-in-user.decorator';
import { UserEntity } from '../users/entities/user.entity';

@UseFilters(WsExceptionFilter)
@UsePipes(
  new ValidationPipe({
    transform: true,
  }),
)
@UseGuards(JwtAccessGuard)
@WebSocketGateway({ namespace: 'exchange' })
export class ExchangeRateGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ExchangeRateGateWay.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  handleConnection(client: Socket) {
    this.logger.verbose(`Websocket Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.verbose(`Webscket disconnected: ${client.id}`);
  }

  /**
   * @event subscribe
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() dto: ExchangeRateSubscribeDto,
    @ConnectedSocket() client: Socket,
    @LoggedInUser() user: UserEntity,
  ) {}
}
