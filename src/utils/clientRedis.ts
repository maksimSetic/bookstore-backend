import 'dotenv/config';
import { Redis } from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;

export const clientRedis = new Redis({
  host: redisHost,
  port: redisPort,
});
