import express from 'express';
import { dataEncryption, DataMasking, auditLogger, dataRetention, PIIDetector } from '../../middleware/compliance.js';
import { getDB } from '../../config/db.js';

const router = express.Router();

// Get compliance status
router.get('/status', (req, res) => {
  try {
    const complianceStatus = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      gdpr: {
        enabled: true,
        dataEncryption: !!process.env.ENCRYPTION_KEY,
        auditLogging: true,
        dataRetention: true,
        consentManagement: true,
        dataSubjectRights: true
      },
      hipaa: {
        enabled: true,
        phiEncryption: !!process.env.ENCRYPTION_KEY,
        auditControls: true,
        accessControls: true,
        integrityControls: true,
        transmissionSecurity: true
      },
      security: {
        encryptionKeyLength: process.env.ENCRYPTION_KEY ? 256 : 0,
        hashingAlgorithm: 'SHA-512',
        encryptionAlgorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2'
      }
    };

    res.json({
      status: 'success',
      compliance: complianceStatus
    });
  } catch (error) {
    console.error('Compliance status error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Encrypt sensitive data
router.post('/encrypt', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        status: 'error',
        error: 'Data is required'
      });
    }

    const encrypted = dataEncryption.encrypt(JSON.stringify(data));
    
    auditLogger.log('data_encrypted', req.user?.userCode || 'anonymous', {
      dataType: typeof data,
      requestId: req.requestId
    });

    res.json({
      status: 'success',
      encrypted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Encryption error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Decrypt sensitive data
router.post('/decrypt', (req, res) => {
  try {
    const { encrypted } = req.body;
    
    if (!encrypted) {
      return res.status(400).json({
        status: 'error',
        error: 'Encrypted data is required'
      });
    }

    const decrypted = JSON.parse(dataEncryption.decrypt(encrypted));
    
    auditLogger.log('data_decrypted', req.user?.userCode || 'anonymous', {
      requestId: req.requestId
    });

    res.json({
      status: 'success',
      decrypted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Decryption error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mask PII data
router.post('/mask', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        status: 'error',
        error: 'Text is required'
      });
    }

    const masked = PIIDetector.maskPII(text);
    const detectedPII = PIIDetector.detectPII(text);
    
    auditLogger.log('pii_masked', req.user?.userCode || 'anonymous', {
      piiTypes: Object.keys(detectedPII),
      requestId: req.requestId
    });

    res.json({
      status: 'success',
      original: text,
      masked,
      detectedPII,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('PII masking error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      action, 
      limit = 100, 
      offset = 0 
    } = req.query;

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        status: 'error',
        error: 'Database not available'
      });
    }

    // Build query
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (userId) query.userId = userId;
    if (action) query.action = action;

    // Get audit logs
    const logs = await db.collection('auditlogs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .toArray();

    // Get total count
    const total = await db.collection('auditlogs').countDocuments(query);

    // Mask sensitive information in logs
    const maskedLogs = logs.map(log => ({
      ...log,
      details: {
        ...log.details,
        // Mask any PII in details
        ...(log.details.email && { email: DataMasking.maskEmail(log.details.email) }),
        ...(log.details.phone && { phone: DataMasking.maskPhone(log.details.phone) }),
        ...(log.details.name && { name: DataMasking.maskName(log.details.name) })
      }
    }));

    auditLogger.log('audit_logs_accessed', req.user?.userCode || 'anonymous', {
      query,
      requestId: req.requestId
    });

    res.json({
      status: 'success',
      logs: maskedLogs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Data subject access request (DSAR)
router.post('/dsar', async (req, res) => {
  try {
    const { userCode, email, requestType } = req.body;
    
    if (!userCode || !email || !requestType) {
      return res.status(400).json({
        status: 'error',
        error: 'User code, email, and request type are required'
      });
    }

    const db = getDB();
    if (!db) {
      return res.status(503).json({
        status: 'error',
        error: 'Database not available'
      });
    }

    // Find user data
    const userData = await db.collection('organizationusers').findOne(
      { userCode, email },
      { projection: { password: 0 } }
    );

    if (!userData) {
      return res.status(404).json({
        status: 'error',
        error: 'User not found'
      });
    }

    // Collect all user-related data
    const userRelatedData = {
      profile: userData,
      bloodRequests: await db.collection('bloodrequests').find(
        { userId: userData._id },
        { projection: { patientDetails: 0 } }
      ).toArray(),
      auditLogs: await db.collection('auditlogs').find(
        { userId: userCode },
        { projection: { details: 0 } }
      ).toArray()
    };

    // Create DSAR record
    const dsarRecord = {
      requestId: `DSAR-${Date.now()}`,
      userCode,
      email,
      requestType, // 'access', 'deletion', 'correction', 'portability'
      status: 'processing',
      createdAt: new Date(),
      processedAt: null,
      dataProvided: requestType === 'access' ? userRelatedData : null,
      requestId: req.requestId
    };

    await db.collection('dsar_requests').insertOne(dsarRecord);

    auditLogger.log('dsar_created', req.user?.userCode || 'anonymous', {
      requestId: dsarRecord.requestId,
      requestType,
      userCode,
      requestId: req.requestId
    });

    res.json({
      status: 'success',
      requestId: dsarRecord.requestId,
      message: 'Data subject access request has been submitted',
      estimatedProcessingTime: '30 days',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DSAR error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Run data retention cleanup
router.post('/data-retention/cleanup', async (req, res) => {
  try {
    await dataRetention.cleanupExpiredData();
    
    auditLogger.log('data_retention_cleanup', req.user?.userCode || 'anonymous', {
      requestId: req.requestId
    });

    res.json({
      status: 'success',
      message: 'Data retention cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Data retention cleanup error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get data retention policy
router.get('/data-retention/policy', (req, res) => {
  try {
    const policy = {
      auditLogs: {
        retentionPeriod: '7 years',
        reason: 'Legal and compliance requirements',
        gdprArticle: 'Article 5(1)(e)',
        hipaaRequirement: '45 CFR 164.316(b)(1)'
      },
      bloodRequests: {
        retentionPeriod: '5 years',
        reason: 'Medical record retention',
        gdprArticle: 'Article 9(2)(h)',
        hipaaRequirement: '45 CFR 164.316(b)(2)'
      },
      donorRegistrations: {
        retentionPeriod: '7 years',
        reason: 'Donor medical history',
        gdprArticle: 'Article 9(2)(h)',
        hipaaRequirement: '45 CFR 164.316(b)(2)'
      },
      userSessions: {
        retentionPeriod: '30 days',
        reason: 'Security and access monitoring',
        gdprArticle: 'Article 5(1)(f)',
        hipaaRequirement: '45 CFR 164.312(a)(1)'
      }
    };

    res.json({
      status: 'success',
      policy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Data retention policy error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
