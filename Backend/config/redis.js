import redis from 'redis';

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
    this.keyPrefix = 'bloodbank:';
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = redis.createClient({
        url: redisUrl,
        retry_delay_on_failover: 100,
        retry_delay_on_cluster_down: 300,
        enable_offline_queue: false,
        lazyConnect: true
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Generate cache key
  generateKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  // Set cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      await this.client.setEx(cacheKey, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  // Get cache
  async get(key) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const cacheKey = this.generateKey(key);
      const value = await this.client.get(cacheKey);
      
      if (value === null) {
        return null;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Delete cache
  async del(key) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache delete');
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      await this.client.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Set cache with expiration only if key doesn't exist
  async setNX(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache setNX');
      return false;
    }

    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      const result = await this.client.set(cacheKey, serializedValue, {
        EX: ttl,
        NX: true
      });
      
      return result === 'OK';
    } catch (error) {
      console.error('Redis setNX error:', error);
      return false;
    }
  }

  // Increment counter
  async incr(key, amount = 1) {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache increment');
      return 0;
    }

    try {
      const cacheKey = this.generateKey(key);
      return await this.client.incrBy(cacheKey, amount);
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  }

  // Get TTL of key
  async ttl(key) {
    if (!this.isConnected) {
      return -1;
    }

    try {
      const cacheKey = this.generateKey(key);
      return await this.client.ttl(cacheKey);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }

  // Clear all cache with prefix
  async clear() {
    if (!this.isConnected) {
      console.warn('Redis not connected, skipping cache clear');
      return false;
    }

    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️  Cleared ${keys.length} cache entries`);
      }
      
      return true;
    } catch (error) {
      console.error('Redis clear error:', error);
      return false;
    }
  }

  // Cache blood bank data
  async cacheBloodBanks(bloodBanks, ttl = 1800) {
    return this.set('bloodbanks:list', bloodBanks, ttl);
  }

  // Get cached blood banks
  async getCachedBloodBanks() {
    return this.get('bloodbanks:list');
  }

  // Cache NGO data
  async cacheNgos(ngos, ttl = 1800) {
    return this.set('ngos:list', ngos, ttl);
  }

  // Get cached NGOs
  async getCachedNgos() {
    return this.get('ngos:list');
  }

  // Cache user session
  async cacheUserSession(userCode, sessionData, ttl = 7200) {
    return this.set(`session:${userCode}`, sessionData, ttl);
  }

  // Get cached user session
  async getCachedUserSession(userCode) {
    return this.get(`session:${userCode}`);
  }

  // Cache API response
  async cacheApiResponse(endpoint, params, data, ttl = 300) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.set(key, data, ttl);
  }

  // Get cached API response
  async getCachedApiResponse(endpoint, params) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.get(key);
  }

  // Cache blood stock data
  async cacheBloodStock(bloodBankId, stockData, ttl = 600) {
    return this.set(`bloodstock:${bloodBankId}`, stockData, ttl);
  }

  // Get cached blood stock
  async getCachedBloodStock(bloodBankId) {
    return this.get(`bloodstock:${bloodBankId}`);
  }

  // Cache search results
  async cacheSearchResults(query, results, ttl = 900) {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return this.set(key, results, ttl);
  }

  // Get cached search results
  async getCachedSearchResults(query) {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return this.get(key);
  }

  // Rate limiting
  async checkRateLimit(identifier, limit = 100, window = 60) {
    const key = `ratelimit:${identifier}`;
    const current = await this.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, window);
    }
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: await this.ttl(key)
    };
  }

  // Cache statistics
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.client.info();
      const keyspace = await this.client.dbSize();
      
      return {
        connected: true,
        memory: info.memory,
        keyspace,
        uptime: info.uptime_in_seconds
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return { connected: false, error: error.message };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const stats = await this.getStats();
      return {
        status: stats.connected ? 'healthy' : 'unhealthy',
        connected: stats.connected,
        keyspace: stats.keyspace || 0,
        memory: stats.memory || {},
        uptime: stats.uptime || 0
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const redisCache = new RedisCache();

// Initialize Redis connection
const initializeRedis = async () => {
  try {
    await redisCache.connect();
    console.log('🚀 Redis cache initialized');
  } catch (error) {
    console.warn('⚠️  Redis initialization failed, running without cache:', error.message);
  }
};

export { redisCache, initializeRedis };
