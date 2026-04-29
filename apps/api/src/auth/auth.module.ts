import { forwardRef, Module } from '@nestjs/common';
import { ConfigService, type ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import type authConfig from '../config/auth.config';
import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

type Env = { auth: ConfigType<typeof authConfig> };

@Module({
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('auth.jwtSecret', { infer: true }),
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
