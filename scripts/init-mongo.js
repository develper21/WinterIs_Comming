// MongoDB initialization script
db = db.getSiblingDB('sebn_db');

// Create collections with validation
db.createCollection('organizations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['organizationCode', 'name', 'type', 'email', 'phone'],
      properties: {
        organizationCode: {
          bsonType: 'string',
          pattern: '^[A-Z]{3,4}-[A-Z]{3}-\\d{3}$'
        },
        name: { bsonType: 'string' },
        type: { bsonType: 'string', enum: ['hospital', 'bloodbank', 'ngo'] },
        email: { bsonType: 'string' },
        phone: { bsonType: 'string' },
        status: { bsonType: 'string', enum: ['pending', 'approved', 'rejected'] }
      }
    }
  }
});

db.createCollection('organizationusers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userCode', 'name', 'email', 'password', 'role', 'organizationId'],
      properties: {
        userCode: { bsonType: 'string' },
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        role: { bsonType: 'string' },
        organizationId: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('bloodrequests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['requestId', 'hospitalId', 'bloodGroup', 'units', 'urgency', 'status'],
      properties: {
        requestId: { bsonType: 'string' },
        hospitalId: { bsonType: 'string' },
        bloodGroup: { bsonType: 'string' },
        units: { bsonType: 'int' },
        urgency: { bsonType: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        status: { bsonType: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'] }
      }
    }
  }
});

db.createCollection('bloodbanks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'location', 'bloodStock'],
      properties: {
        name: { bsonType: 'string' },
        location: { bsonType: 'object' },
        bloodStock: { bsonType: 'object' }
      }
    }
  }
});

db.createCollection('ngos', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'contact', 'donors'],
      properties: {
        name: { bsonType: 'string' },
        contact: { bsonType: 'string' },
        donors: { bsonType: 'array' }
      }
    }
  }
});

db.createCollection('auditlogs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'action', 'timestamp', 'details'],
      properties: {
        userId: { bsonType: 'string' },
        action: { bsonType: 'string' },
        timestamp: { bsonType: 'date' },
        details: { bsonType: 'object' }
      }
    }
  }
});

// Create indexes for better performance
db.organizations.createIndex({ organizationCode: 1 }, { unique: true });
db.organizations.createIndex({ type: 1 });
db.organizations.createIndex({ status: 1 });

db.organizationusers.createIndex({ email: 1 }, { unique: true });
db.organizationusers.createIndex({ organizationId: 1 });
db.organizationusers.createIndex({ role: 1 });

db.bloodrequests.createIndex({ requestId: 1 }, { unique: true });
db.bloodrequests.createIndex({ hospitalId: 1 });
db.bloodrequests.createIndex({ bloodGroup: 1 });
db.bloodrequests.createIndex({ urgency: 1 });
db.bloodrequests.createIndex({ status: 1 });
db.bloodrequests.createIndex({ createdAt: 1 });

db.bloodbanks.createIndex({ location: '2dsphere' });
db.bloodbanks.createIndex({ name: 1 });

db.ngos.createIndex({ name: 1 });
db.ngos.createIndex({ location: '2dsphere' });

db.auditlogs.createIndex({ userId: 1 });
db.auditlogs.createIndex({ action: 1 });
db.auditlogs.createIndex({ timestamp: 1 });

// Create default admin user (for development)
if (db.getName() === 'sebn_db') {
  db.organizationusers.insertOne({
    userCode: 'ADMIN-001',
    name: 'System Administrator',
    email: 'admin@bloodbank.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJflLxQxe', // password: admin123
    role: 'superadmin',
    organizationId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  print('MongoDB initialized successfully with collections and indexes');
  print('Default admin user created: admin@bloodbank.com / admin123');
}
