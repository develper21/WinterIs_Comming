import { performance } from 'perf_hooks';

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      responseTime: 1000, // 1 second
      memoryUsage: 512 * 1024 * 1024, // 512MB
      cpuUsage: 80 // 80%
    };
  }

  // Start timing an operation
  startTimer(operationId) {
    this.metrics.set(operationId, {
      startTime: performance.now(),
      startMemory: process.memoryUsage()
    });
  }

  // End timing and calculate metrics
  endTimer(operationId, metadata = {}) {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      console.warn(`⚠️ No timer found for operation: ${operationId}`);
      return null;
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - metric.startTime;
    const memoryDelta = endMemory.heapUsed - metric.startMemory.heapUsed;

    const result = {
      operationId,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      memoryDelta,
      timestamp: new Date().toISOString(),
      metadata,
      thresholds: {
        responseTime: this.thresholds.responseTime,
        memoryUsage: this.thresholds.memoryUsage
      },
      alerts: []
    };

    // Check for performance alerts
    if (duration > this.thresholds.responseTime) {
      result.alerts.push({
        type: 'SLOW_RESPONSE',
        message: `Operation took ${duration}ms (threshold: ${this.thresholds.responseTime}ms)`,
        severity: duration > this.thresholds.responseTime * 2 ? 'HIGH' : 'MEDIUM'
      });
    }

    if (Math.abs(memoryDelta) > this.thresholds.memoryUsage) {
      result.alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        message: `Memory delta: ${Math.round(memoryDelta / 1024 / 1024)}MB`,
        severity: 'MEDIUM'
      });
    }

    // Log the metric
    this.logMetric(result);

    // Clean up
    this.metrics.delete(operationId);

    return result;
  }

  // Log performance metrics
  logMetric(metric) {
    const logLevel = metric.alerts.some(alert => alert.severity === 'HIGH') ? 'error' : 
                    metric.alerts.length > 0 ? 'warn' : 'info';
    
    const message = `📊 Performance: ${metric.operationId} - ${metric.duration}ms`;
    
    if (logLevel === 'error') {
      console.error(message, metric);
    } else if (logLevel === 'warn') {
      console.warn(message, metric);
    } else {
      console.log(message, metric);
    }

    // Store for aggregation
    this.storeMetric(metric);
  }

  // Store metrics for analysis
  storeMetric(metric) {
    // In production, this would send to a metrics collection system
    // For now, we'll keep in-memory with rotation
    const key = `metrics_${new Date().toISOString().split('T')[0]}`;
    if (!this.metricsHistory) {
      this.metricsHistory = new Map();
    }
    
    if (!this.metricsHistory.has(key)) {
      this.metricsHistory.set(key, []);
    }
    
    this.metricsHistory.get(key).push(metric);
    
    // Keep only last 7 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    for (const [dateKey, metrics] of this.metricsHistory.entries()) {
      if (new Date(dateKey) < cutoffDate) {
        this.metricsHistory.delete(dateKey);
      }
    }
  }

  // Get performance summary
  getSummary(timeRange = '1h') {
    const now = new Date();
    let cutoffTime;
    
    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
    }

    const recentMetrics = [];
    for (const [dateKey, metrics] of this.metricsHistory?.entries() || []) {
      if (new Date(dateKey) >= cutoffTime) {
        recentMetrics.push(...metrics);
      }
    }

    if (recentMetrics.length === 0) {
      return {
        timeRange,
        totalOperations: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        errorCount: 0,
        alertCount: 0
      };
    }

    const responseTimes = recentMetrics.map(m => m.duration);
    const alertCount = recentMetrics.reduce((sum, m) => sum + m.alerts.length, 0);

    return {
      timeRange,
      totalOperations: recentMetrics.length,
      avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length * 100) / 100,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      errorCount: recentMetrics.filter(m => m.alerts.some(a => a.severity === 'HIGH')).length,
      alertCount,
      alerts: recentMetrics.flatMap(m => m.alerts).slice(0, 10) // Last 10 alerts
    };
  }

  // System health check
  getSystemHealth() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
        rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      performance: this.getSummary('1h'),
      alerts: this.getRecentAlerts()
    };
  }

  // Get recent alerts
  getRecentAlerts(limit = 10) {
    const alerts = [];
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // Last hour
    
    for (const [dateKey, metrics] of this.metricsHistory?.entries() || []) {
      if (new Date(dateKey) >= cutoffTime) {
        for (const metric of metrics) {
          for (const alert of metric.alerts) {
            alerts.push({
              ...alert,
              operationId: metric.operationId,
              timestamp: metric.timestamp
            });
          }
        }
      }
    }
    
    return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware for automatic performance tracking
export const performanceTrackingMiddleware = (req, res, next) => {
  const operationId = `${req.method}_${req.path}_${Date.now()}`;
  
  // Start timing
  performanceMonitor.startTimer(operationId);
  
  // Store operation ID in request for later use
  req.performanceOperationId = operationId;
  
  // End timing on response finish
  res.on('finish', () => {
    performanceMonitor.endTimer(operationId, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

// Decorator for function performance tracking
export const trackPerformance = (operationName) => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      const operationId = `${operationName}_${Date.now()}`;
      performanceMonitor.startTimer(operationId);
      
      try {
        const result = await method.apply(this, args);
        
        performanceMonitor.endTimer(operationId, {
          functionName: propertyName,
          className: target.constructor.name,
          argsCount: args.length
        });
        
        return result;
      } catch (error) {
        performanceMonitor.endTimer(operationId, {
          functionName: propertyName,
          className: target.constructor.name,
          error: error.message
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
};
