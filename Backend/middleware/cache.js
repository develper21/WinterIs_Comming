import { redisCache } from '../config/redis.js';

// Cache middleware factory
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = null,
    condition = () => true,
    skipCache = false
  } = options;

  return async (req, res, next) => {
    // Skip caching if Redis is not connected
    if (!redisCache.isConnected) {
      return next();
    }

    // Skip cache if condition is not met
    if (!condition(req, res)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      // Try to get cached response
      const cachedResponse = await redisCache.get(cacheKey);
      
      if (cachedResponse) {
        // Return cached response
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cachedResponse);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache the response
        redisCache.set(cacheKey, data, ttl).catch(err => {
          console.warn('Cache set error:', err.message);
        });
        
        // Set cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        
        // Send original response
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// API response cache middleware
export const apiCacheMiddleware = (ttl = 300) => {
  return cacheMiddleware({
    ttl,
    condition: (req) => req.method === 'GET' && req.path.startsWith('/api/'),
    keyGenerator: (req) => `api:${req.path}:${JSON.stringify(req.query)}`
  });
};

// Static data cache middleware
export const staticCacheMiddleware = (ttl = 3600) => {
  return cacheMiddleware({
    ttl,
    condition: (req) => req.method === 'GET',
    keyGenerator: (req) => `static:${req.path}`
  });
};

// User session cache middleware
export const sessionCacheMiddleware = () => {
  return async (req, res, next) => {
    if (!redisCache.isConnected || !req.user) {
      return next();
    }

    try {
      const sessionData = await redisCache.getCachedUserSession(req.user.userCode);
      
      if (sessionData) {
        req.userSession = sessionData;
        res.set('X-Session-Cache', 'HIT');
      } else {
        res.set('X-Session-Cache', 'MISS');
      }
    } catch (error) {
      console.error('Session cache error:', error);
    }

    next();
  };
};

// Rate limiting middleware
export const rateLimitMiddleware = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip
  } = options;

  return async (req, res, next) => {
    if (!redisCache.isConnected) {
      return next();
    }

    try {
      const identifier = keyGenerator(req);
      const result = await redisCache.checkRateLimit(identifier, max, windowMs / 1000);
      
      if (!result.allowed) {
        res.set('X-RateLimit-Limit', max);
        res.set('X-RateLimit-Remaining', result.remaining);
        res.set('X-RateLimit-Reset', result.resetTime);
        
        return res.status(429).json({
          error: message,
          retryAfter: result.resetTime
        });
      }

      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Reset', result.resetTime);
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next();
    }
  };
};

// Blood bank data cache middleware
export const bloodBankCacheMiddleware = () => {
  return async (req, res, next) => {
    if (!redisCache.isConnected) {
      return next();
    }

    // Cache blood bank list
    if (req.path === '/api/blood-banks' && req.method === 'GET') {
      try {
        const cachedBloodBanks = await redisCache.getCachedBloodBanks();
        
        if (cachedBloodBanks) {
          res.set('X-BloodBank-Cache', 'HIT');
          return res.json(cachedBloodBanks);
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
          redisCache.cacheBloodBanks(data).catch(err => {
            console.warn('Blood bank cache error:', err.message);
          });
          res.set('X-BloodBank-Cache', 'MISS');
          return originalJson.call(this, data);
        };
      } catch (error) {
        console.error('Blood bank cache error:', error);
      }
    }

    // Cache blood stock data
    if (req.path.match(/\/api\/blood-banks\/[^\/]+\/stock/) && req.method === 'GET') {
      const bloodBankId = req.path.split('/')[3];
      
      try {
        const cachedStock = await redisCache.getCachedBloodStock(bloodBankId);
        
        if (cachedStock) {
          res.set('X-BloodStock-Cache', 'HIT');
          return res.json(cachedStock);
        }

        const originalJson = res.json;
        res.json = function(data) {
          redisCache.cacheBloodStock(bloodBankId, data).catch(err => {
            console.warn('Blood stock cache error:', err.message);
          });
          res.set('X-BloodStock-Cache', 'MISS');
          return originalJson.call(this, data);
        };
      } catch (error) {
        console.error('Blood stock cache error:', error);
      }
    }

    next();
  };
};

// NGO data cache middleware
export const ngoCacheMiddleware = () => {
  return async (req, res, next) => {
    if (!redisCache.isConnected) {
      return next();
    }

    if (req.path === '/api/public-ngos' && req.method === 'GET') {
      try {
        const cachedNgos = await redisCache.getCachedNgos();
        
        if (cachedNgos) {
          res.set('X-NGO-Cache', 'HIT');
          return res.json(cachedNgos);
        }

        const originalJson = res.json;
        res.json = function(data) {
          redisCache.cacheNgos(data).catch(err => {
            console.warn('NGO cache error:', err.message);
          });
          res.set('X-NGO-Cache', 'MISS');
          return originalJson.call(this, data);
        };
      } catch (error) {
        console.error('NGO cache error:', error);
      }
    }

    next();
  };
};

// Search cache middleware
export const searchCacheMiddleware = () => {
  return async (req, res, next) => {
    if (!redisCache.isConnected) {
      return next();
    }

    if (req.path.startsWith('/api/search') && req.method === 'GET') {
      const query = req.query.q || '';
      
      try {
        const cachedResults = await redisCache.getCachedSearchResults(query);
        
        if (cachedResults) {
          res.set('X-Search-Cache', 'HIT');
          return res.json(cachedResults);
        }

        const originalJson = res.json;
        res.json = function(data) {
          redisCache.cacheSearchResults(query, data).catch(err => {
            console.warn('Search cache error:', err.message);
          });
          res.set('X-Search-Cache', 'MISS');
          return originalJson.call(this, data);
        };
      } catch (error) {
        console.error('Search cache error:', error);
      }
    }

    next();
  };
};

// Cache invalidation middleware
export const invalidateCacheMiddleware = () => {
  return async (req, res, next) => {
    // Invalidate cache on POST, PUT, DELETE requests
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      if (!redisCache.isConnected) {
        return next();
      }

      try {
        // Invalidate related caches
        if (req.path.startsWith('/api/blood-banks')) {
          await redisCache.del('bloodbanks:list');
        }
        
        if (req.path.startsWith('/api/ngos')) {
          await redisCache.del('ngos:list');
        }
        
        if (req.path.startsWith('/api/blood-requests')) {
          await redisCache.clear(); // Clear all cache for blood requests
        }
        
        res.set('X-Cache-Invalidated', 'true');
      } catch (error) {
        console.error('Cache invalidation error:', error);
      }
    }

    next();
  };
};

export default {
  cacheMiddleware,
  apiCacheMiddleware,
  staticCacheMiddleware,
  sessionCacheMiddleware,
  rateLimitMiddleware,
  bloodBankCacheMiddleware,
  ngoCacheMiddleware,
  searchCacheMiddleware,
  invalidateCacheMiddleware
};
