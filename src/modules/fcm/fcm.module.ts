import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fcmAdmin from 'firebase-admin';
import { AppConfig } from '../../infrastructure/config/config.type';
import { FcmService } from './fcm.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [
    FcmService,
    {
      provide: 'FCM_ADMIN',
      useFactory: async (configService: ConfigService<AppConfig, true>) => {
        return fcmAdmin.initializeApp({
          credential: fcmAdmin.credential.cert({
            projectId: configService.get('fcm.FCM_PROJECT_ID', { infer: true }),
            clientEmail: configService.get('fcm.FCM_CLIENT_EMAIL', {
              infer: true,
            }),
            privateKey: configService.get('fcm.FCM_PRIVATE_KEY', {
              infer: true,
            }),
          }),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [FcmService],
})
export class FcmModule {}
