// Database Optimization Script
// Run with: node scripts/database-optimization.js

const { MongoClient } = require('mongodb');

class DatabaseOptimizer {
  constructor() {
    this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sebn_db';
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db();
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('✅ Disconnected from MongoDB');
    }
  }

  // Create indexes for better performance
  async createIndexes() {
    console.log('🔧 Creating database indexes...');
    
    const indexes = [
      // Organizations collection
      {
        collection: 'organizations',
        index: { organizationCode: 1 },
        options: { unique: true, name: 'idx_organization_code' }
      },
      {
        collection: 'organizations',
        index: { type: 1, status: 1 },
        options: { name: 'idx_type_status' }
      },
      {
        collection: 'organizations',
        index: { location: '2dsphere' },
        options: { name: 'idx_location_geo' }
      },
      
      // Organization users collection
      {
        collection: 'organizationusers',
        index: { email: 1 },
        options: { unique: true, name: 'idx_user_email' }
      },
      {
        collection: 'organizationusers',
        index: { organizationId: 1, role: 1 },
        options: { name: 'idx_org_role' }
      },
      {
        collection: 'organizationusers',
        index: { userCode: 1 },
        options: { unique: true, name: 'idx_user_code' }
      },
      
      // Blood requests collection
      {
        collection: 'bloodrequests',
        index: { requestId: 1 },
        options: { unique: true, name: 'idx_request_id' }
      },
      {
        collection: 'bloodrequests',
        index: { hospitalId: 1, status: 1 },
        options: { name: 'idx_hospital_status' }
      },
      {
        collection: 'bloodrequests',
        index: { bloodGroup: 1, urgency: 1 },
        options: { name: 'idx_blood_urgency' }
      },
      {
        collection: 'bloodrequests',
        index: { createdAt: -1 },
        options: { name: 'idx_created_at_desc' }
      },
      {
        collection: 'bloodrequests',
        index: { status: 1, urgency: 1, createdAt: -1 },
        options: { name: 'idx_status_urgency_created' }
      },
      
      // Blood banks collection
      {
        collection: 'bloodbanks',
        index: { name: 1 },
        options: { name: 'idx_bloodbank_name' }
      },
      {
        collection: 'bloodbanks',
        index: { location: '2dsphere' },
        options: { name: 'idx_bloodbank_location' }
      },
      {
        collection: 'bloodbanks',
        index: { 'bloodStock.A+': 1 },
        options: { name: 'idx_blood_a_pos' }
      },
      {
        collection: 'bloodbanks',
        index: { 'bloodStock.B+': 1 },
        options: { name: 'idx_blood_b_pos' }
      },
      {
        collection: 'bloodbanks',
        index: { 'bloodStock.O+': 1 },
        options: { name: 'idx_blood_o_pos' }
      },
      {
        collection: 'bloodbanks',
        index: { 'bloodStock.AB+': 1 },
        options: { name: 'idx_blood_ab_pos' }
      },
      
      // NGOs collection
      {
        collection: 'ngos',
        index: { name: 1 },
        options: { name: 'idx_ngo_name' }
      },
      {
        collection: 'ngos',
        index: { location: '2dsphere' },
        options: { name: 'idx_ngo_location' }
      },
      {
        collection: 'ngos',
        index: { contact: 1 },
        options: { name: 'idx_ngo_contact' }
      },
      
      // Audit logs collection
      {
        collection: 'auditlogs',
        index: { userId: 1, timestamp: -1 },
        options: { name: 'idx_user_timestamp' }
      },
      {
        collection: 'auditlogs',
        index: { action: 1, timestamp: -1 },
        options: { name: 'idx_action_timestamp' }
      },
      {
        collection: 'auditlogs',
        index: { timestamp: -1 },
        options: { name: 'idx_timestamp_desc' }
      },
      {
        collection: 'auditlogs',
        index: { requestId: 1 },
        options: { name: 'idx_request_id' }
      },
      
      // Camp slots collection
      {
        collection: 'campslots',
        index: { campId: 1, startTime: 1 },
        options: { name: 'idx_camp_start_time' }
      },
      {
        collection: 'campslots',
        index: { startTime: 1, endTime: 1 },
        options: { name: 'idx_time_range' }
      },
      {
        collection: 'campslots',
        index: { status: 1, startTime: 1 },
        options: { name: 'idx_status_start_time' }
      }
    ];

    for (const { collection, index, options } of indexes) {
      try {
        await this.db.collection(collection).createIndex(index, options);
        console.log(`✅ Created index: ${options.name} on ${collection}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`⚠️  Index already exists: ${options.name} on ${collection}`);
        } else {
          console.error(`❌ Failed to create index ${options.name}:`, error.message);
        }
      }
    }
  }

  // Analyze query performance
  async analyzeQueries() {
    console.log('📊 Analyzing query performance...');
    
    // Get collection statistics
    const collections = [
      'organizations',
      'organizationusers',
      'bloodrequests',
      'bloodbanks',
      'ngos',
      'auditlogs',
      'campslots'
    ];

    for (const collectionName of collections) {
      try {
        const stats = await this.db.collection(collectionName).stats();
        console.log(`\n📈 ${collectionName}:`);
        console.log(`  Documents: ${stats.count}`);
        console.log(`  Avg doc size: ${Math.round(stats.avgObjSize / 1024)}KB`);
        console.log(`  Total size: ${Math.round(stats.size / 1024 / 1024)}MB`);
        console.log(`  Indexes: ${stats.nindexes}`);
        console.log(`  Index size: ${Math.round(stats.totalIndexSize / 1024 / 1024)}MB`);
      } catch (error) {
        console.log(`⚠️  Could not get stats for ${collectionName}: ${error.message}`);
      }
    }
  }

  // Optimize database
  async optimize() {
    console.log('⚡ Optimizing database...');
    
    // Compact all collections
    const collections = await this.db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        await this.db.collection(collection.name).compact();
        console.log(`✅ Compacted collection: ${collection.name}`);
      } catch (error) {
        console.log(`⚠️  Could not compact ${collection.name}: ${error.message}`);
      }
    }

    // Rebuild indexes
    console.log('🔄 Rebuilding indexes...');
    await this.db.admin().reIndex();
    console.log('✅ Indexes rebuilt');
  }

  // Clean up old data
  async cleanupOldData() {
    console.log('🧹 Cleaning up old data...');
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months ago
    
    // Clean old audit logs
    const auditResult = await this.db.collection('auditlogs').deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    console.log(`🗑️  Deleted ${auditResult.deletedCount} old audit log entries`);

    // Clean old completed blood requests
    const requestResult = await this.db.collection('bloodrequests').deleteMany({
      status: 'completed',
      createdAt: { $lt: cutoffDate }
    });
    console.log(`🗑️  Deleted ${requestResult.deletedCount} old completed blood requests`);
  }

  // Generate optimization report
  async generateReport() {
    console.log('\n📋 Database Optimization Report');
    console.log('=====================================');
    
    // Get server status
    const serverStatus = await this.db.admin().serverStatus();
    console.log(`MongoDB Version: ${serverStatus.version}`);
    console.log(`Uptime: ${Math.round(serverStatus.uptime / 3600)} hours`);
    console.log(`Connections: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
    console.log(`Memory Usage: ${Math.round(serverStatus.mem.resident / 1024 / 1024)}MB`);
    
    // Get database stats
    const dbStats = await this.db.stats();
    console.log(`Database Size: ${Math.round(dbStats.dataSize / 1024 / 1024)}MB`);
    console.log(`Index Size: ${Math.round(dbStats.indexSize / 1024 / 1024)}MB`);
    console.log(`Collections: ${dbStats.collections}`);
    console.log(`Documents: ${dbStats.objects}`);
    
    console.log('\n✅ Database optimization completed successfully!');
  }

  // Run full optimization
  async runFullOptimization() {
    try {
      await this.connect();
      await this.createIndexes();
      await this.analyzeQueries();
      await this.optimize();
      await this.cleanupOldData();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Optimization failed:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new DatabaseOptimizer();
  optimizer.runFullOptimization().catch(console.error);
}

module.exports = DatabaseOptimizer;
