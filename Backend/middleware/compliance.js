import crypto from 'crypto';

// Compliance middleware for GDPR/HIPAA
export const complianceMiddleware = (req, res, next) => {
  // Add compliance headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add security headers for sensitive data
  if (req.path.includes('/api/') && req.path.includes('/auth/') || req.path.includes('/medical/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  // Log access for audit trail
  logAccess(req);
  
  next();
};

// Data encryption utilities
export class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.ivLength = 16;
    this.tagLength = 16;
  }

  // Encrypt sensitive data
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.secretKey);
      cipher.setAAD(Buffer.from('bloodbank', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, tag } = encryptedData;
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      decipher.setAAD(Buffer.from('bloodbank', 'utf8'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash sensitive data (for passwords, etc.)
  hash(data, salt = null) {
    try {
      const actualSalt = salt || crypto.randomBytes(16);
      const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
      return {
        hash: hash.toString('hex'),
        salt: actualSalt.toString('hex')
      };
    } catch (error) {
      console.error('Hashing error:', error);
      throw new Error('Failed to hash data');
    }
  }

  // Verify hash
  verifyHash(data, hash, salt) {
    try {
      const hashVerify = crypto.pbkdf2Sync(data, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
      return hashVerify.toString('hex') === hash;
    } catch (error) {
      console.error('Hash verification error:', error);
      return false;
    }
  }
}

// Data masking utilities
export class DataMasking {
  // Mask email addresses
  static maskEmail(email) {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  }

  // Mask phone numbers
  static maskPhone(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  // Mask names (show first and last initial)
  static maskName(name) {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0][0] + '*'.repeat(parts[0].length - 1);
    }
    return parts[0][0] + '*'.repeat(parts[0].length - 1) + ' ' + 
           parts[parts.length - 1][0] + '*'.repeat(parts[parts.length - 1].length - 1);
  }

  // Mask medical record numbers
  static maskMRN(mrn) {
    if (!mrn) return '';
    return mrn.replace(/(\d{4})\d*(\d{4})/, '$1****$2');
  }
}

// Audit logging
export class AuditLogger {
  static log(action, userId, details = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
      ipAddress: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      requestId: details.requestId || 'unknown'
    };

    // In production, this would go to a secure audit log system
    console.log('AUDIT:', JSON.stringify(auditEntry));
    
    // Store in database for compliance
    this.storeAuditEntry(auditEntry);
  }

  static async storeAuditEntry(entry) {
    try {
      const db = getDB();
      if (db) {
        await db.collection('auditlogs').insertOne(entry);
      }
    } catch (error) {
      console.error('Failed to store audit entry:', error);
    }
  }
}

// Access control
export class AccessControl {
  static hasPermission(userRole, requiredPermission) {
    const permissions = {
      'superadmin': ['read', 'write', 'delete', 'admin', 'audit'],
      'admin': ['read', 'write', 'delete', 'admin'],
      'doctor': ['read', 'write'],
      'nurse': ['read', 'write'],
      'staff': ['read'],
      'patient': ['read_own']
    };

    return permissions[userRole]?.includes(requiredPermission) || false;
  }

  static checkAccess(req, requiredPermission) {
    if (!req.user) {
      return false;
    }

    return this.hasPermission(req.user.role, requiredPermission);
  }
}

// Data retention utilities
export class DataRetention {
  static async cleanupExpiredData() {
    try {
      const db = getDB();
      if (!db) return;

      const retentionPeriods = {
        'auditlogs': 2555, // 7 years in days
        'bloodrequests': 1825, // 5 years
        'donorregistrations': 2555, // 7 years
        'user_sessions': 30 // 30 days
      };

      for (const [collection, days] of Object.entries(retentionPeriods)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await db.collection(collection).deleteMany({
          createdAt: { $lt: cutoffDate }
        });

        if (result.deletedCount > 0) {
          console.log(`Cleaned up ${result.deletedCount} expired records from ${collection}`);
        }
      }
    } catch (error) {
      console.error('Data retention cleanup error:', error);
    }
  }
}

// Access logging function
function logAccess(req) {
  const accessLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userCode || 'anonymous',
    requestId: req.requestId
  };

  // Log access for security monitoring
  if (req.path.includes('/api/auth/') || req.path.includes('/medical/')) {
    console.log('SECURITY_ACCESS:', JSON.stringify(accessLog));
  }
}

// PII detection and masking
export class PIIDetector {
  static detectPII(text) {
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      mrn: /\b[A-Z]{2}\d{6,8}\b/g
    };

    const detected = {};
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        detected[type] = matches;
      }
    }

    return detected;
  }

  static maskPII(text) {
    const pii = this.detectPII(text);
    let maskedText = text;

    if (pii.email) {
      pii.email.forEach(email => {
        maskedText = maskedText.replace(email, DataMasking.maskEmail(email));
      });
    }

    if (pii.phone) {
      pii.phone.forEach(phone => {
        maskedText = maskedText.replace(phone, DataMasking.maskPhone(phone));
      });
    }

    if (pii.ssn) {
      pii.ssn.forEach(ssn => {
        maskedText = maskedText.replace(ssn, '***-**-****');
      });
    }

    return maskedText;
  }
}

// Export instances
export const dataEncryption = new DataEncryption();
export const auditLogger = AuditLogger;
export const accessControl = AccessControl;
export const dataRetention = DataRetention;
export const piiDetector = PIIDetector;
