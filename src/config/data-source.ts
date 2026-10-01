import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USERNAME || process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  entities: ['src/modules/**/*.entity.ts'],

  migrations: ['migrations/*.ts'],
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  namingStrategy: new SnakeNamingStrategy(),
});
