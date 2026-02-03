import express from 'express';
import { performanceMonitor } from '../../config/performance.js';
import { checkSentryHealth } from '../../config/sentry.js';
import { getDB } from '../../config/db.js';

const router = express.Router();

// Get system health and performance metrics
router.get('/health', async (req, res) => {
  try {
    const systemHealth = performanceMonitor.getSystemHealth();
    const sentryHealth = checkSentryHealth();
    
    // Check database health
    let dbHealth = { status: 'unknown', details: null };
    try {
      const db = getDB();
      if (db) {
        await db.admin().ping();
        dbHealth = { status: 'healthy', details: 'MongoDB connection successful' };
      }
    } catch (error) {
      dbHealth = { status: 'unhealthy', details: error.message };
    }
    
    const overallHealth = {
      status: systemHealth.alerts.length === 0 && dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      components: {
        application: {
          status: 'healthy',
          uptime: systemHealth.uptime,
          memory: systemHealth.memory
        },
        database: dbHealth,
        monitoring: {
          sentry: sentryHealth,
          performance: {
            status: systemHealth.alerts.length === 0 ? 'healthy' : 'degraded',
            alerts: systemHealth.alerts
          }
        }
      },
      performance: systemHealth.performance,
      alerts: systemHealth.alerts
    };
    
    res.json(overallHealth);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get performance metrics
router.get('/performance', (req, res) => {
  try {
    const { timeRange = '1h' } = req.query;
    const summary = performanceMonitor.getSummary(timeRange);
    
    res.json({
      status: 'success',
      timeRange,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      metrics: summary
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get detailed system metrics
router.get('/metrics', async (req, res) => {
  try {
    const systemHealth = performanceMonitor.getSystemHealth();
    
    // Get additional system metrics
    const loadAverage = require('os').loadavg();
    const cpus = require('os').cpus();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    
    const detailedMetrics = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime(),
        loadAverage,
        cpu: {
          count: cpus.length,
          model: cpus[0]?.model,
          speed: cpus[0]?.speed
        },
        memory: {
          total: Math.round(totalMemory / 1024 / 1024 * 100) / 100,
          free: Math.round(freeMemory / 1024 / 1024 * 100) / 100,
          used: Math.round((totalMemory - freeMemory) / 1024 / 1024 * 100) / 100,
          usagePercentage: Math.round(((totalMemory - freeMemory) / totalMemory) * 100 * 100) / 100
        }
      },
      application: {
        memory: systemHealth.memory,
        cpu: systemHealth.cpu,
        performance: systemHealth.performance
      },
      alerts: systemHealth.alerts
    };
    
    res.json(detailedMetrics);
  } catch (error) {
    console.error('Detailed metrics error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get recent alerts
router.get('/alerts', (req, res) => {
  try {
    const { limit = 50, severity } = req.query;
    let alerts = performanceMonitor.getRecentAlerts(parseInt(limit));
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database performance metrics
router.get('/database', async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(503).json({
        status: 'error',
        error: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get database stats
    const admin = db.admin();
    const serverStatus = await admin.serverStatus();
    const dbStats = await db.stats();
    
    const databaseMetrics = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      connection: {
        status: 'connected',
        host: serverStatus.host,
        port: serverStatus.port,
        version: serverStatus.version
      },
      performance: {
        operations: serverStatus.opcounters,
        queries: serverStatus.metrics.query,
        commands: serverStatus.metrics.commands,
        deletes: serverStatus.metrics.delete,
        getmore: serverStatus.metrics.getmore,
        inserts: serverStatus.metrics.insert,
        updates: serverStatus.metrics.update
      },
      storage: {
        collections: dbStats.collections,
        dataSize: Math.round(dbStats.dataSize / 1024 / 1024 * 100) / 100,
        indexSize: Math.round(dbStats.indexSize / 1024 / 1024 * 100) / 100,
        storageSize: Math.round(dbStats.storageSize / 1024 / 1024 * 100) / 100
      },
      connections: {
        current: serverStatus.connections.current,
        available: serverStatus.connections.available,
        totalCreated: serverStatus.connections.totalCreated
      }
    };
    
    res.json(databaseMetrics);
  } catch (error) {
    console.error('Database metrics error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
