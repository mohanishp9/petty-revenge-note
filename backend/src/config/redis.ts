import Redis from 'ioredis';

// If REDIS_URL is provided (e.g. on Render), use it directly. 
// Otherwise, fallback to local variables for Docker Compose.
const redisUrl = process.env.REDIS_URL;

const redisClient = redisUrl
  ? new Redis(redisUrl)
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });

redisClient.on('connect', () => {
  console.log('Redis connected.');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redisClient;
