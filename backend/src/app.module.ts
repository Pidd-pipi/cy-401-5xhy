import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { BidModule } from './modules/bid/bid.module';
import { ContractModule } from './modules/contract/contract.module';
import { RequirementModule } from './modules/requirement/requirement.module';
import { UserModule } from './modules/user/user.module';
import { AuthMiddleware } from './common/middlewares/auth.middleware';
import { RequestLoggerMiddleware } from './common/middlewares/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig
    }),
    AuthModule,
    UserModule,
    RequirementModule,
    BidModule,
    ContractModule
  ],
  controllers: [AppController]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware, AuthMiddleware).forRoutes('*');
  }
}
