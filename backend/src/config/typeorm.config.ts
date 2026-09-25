import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Bid } from '../modules/bid/entity/bid.entity';
import { Contract } from '../modules/contract/entity/contract.entity';
import { Requirement } from '../modules/requirement/entity/requirement.entity';
import { User } from '../modules/user/entity/user.entity';
import { OperationLog } from '../utils/operation-log.entity';

export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || 'freelance',
  password: process.env.DB_PASSWORD || 'freelance_pwd',
  database: process.env.DB_NAME || 'freelance',
  entities: [User, Requirement, Bid, Contract, OperationLog],
  synchronize: process.env.TYPEORM_SYNC !== 'false',
  logging: process.env.TYPEORM_LOGGING === 'true',
  charset: 'utf8mb4'
});
