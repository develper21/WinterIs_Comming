import { initSentry, captureError } from '../config/sentry.js';

// Initialize Sentry
initSentry();

// Sentry middleware for Express
export const sentryMiddleware = (err, req, res, next) => {
  // Capture error with context
  captureError(err, {
    user: req.user ? {
      id: req.user.userCode,
      email: req.user.email,
      role: req.user.role
    } : null,
    tags: {
      method: req.method,
      route: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    },
    extra: {
      body: req.body,
      query: req.query,
      params: req.params,
      headers: {
        'content-type': req.get('Content-Type'),
        'authorization': req.get('Authorization') ? '[REDACTED]' : null
      }
    }
  });

  // Continue with error handling
  next(err);
};

// Request tracking middleware
export const requestTrackingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Add request ID for tracing
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log request start
  console.log(`📝 [${req.requestId}] ${req.method} ${req.path} - Started`);
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    console.log(`📊 [${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Track slow requests
    if (duration > 1000) {
      console.warn(`⚠️ [${req.requestId}] Slow request detected: ${duration}ms`);
    }
  });
  
  next();
};

// Performance monitoring middleware
export const performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    if (duration > 500) { // Log requests taking more than 500ms
      console.warn(`🐌 Slow API call: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
    
    // Store performance data for monitoring
    req.performanceData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      timestamp: new Date().toISOString()
    };
  });
  
  next();
};

// Error context middleware
export const errorContextMiddleware = (req, res, next) => {
  // Add user context to request
  if (req.user) {
    req.userContext = {
      userCode: req.user.userCode,
      role: req.user.role,
      organizationCode: req.user.organizationCode
    };
  }
  
  // Add request metadata
  req.requestMetadata = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  
  next();
};
