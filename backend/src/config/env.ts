import { cleanEnv, str, port, host } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT: port({ default: 3001 }),
  MONGO_URI: str(),
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  BREVO_API_KEY: str(),
  BREVO_FROM_EMAIL: str(),
  REDIS_HOST: host({ default: '127.0.0.1' }),
  REDIS_PORT: port({ default: 6379 }),
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
});
