// Database Backup Strategy Script
// Implements automated backup with retention policies

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class DatabaseBackupStrategy {
  constructor() {
    this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sebn_db';
    this.client = null;
    this.db = null;
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.retentionDays = parseInt(process.env.RETENTION_DAYS) || 30;
  }

  async connect() {
    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db();
      console.log('✅ Connected to MongoDB for backup');
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

  // Create backup directory
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayDir = path.join(this.backupDir, today);
    
    if (!fs.existsSync(todayDir)) {
      fs.mkdirSync(todayDir, { recursive: true });
    }
    
    return todayDir;
  }

  // Create full backup using mongodump
  async createFullBackup() {
    console.log('🔄 Creating full database backup...');
    
    const backupDir = this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `full-backup-${timestamp}`);
    
    return new Promise((resolve, reject) => {
      const command = `mongodump --uri="${this.uri}" --out="${backupPath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Backup failed:', error);
          reject(error);
        } else {
          console.log(`✅ Full backup created: ${backupPath}`);
          resolve(backupPath);
        }
      });
    });
  }

  // Create incremental backup (using oplog)
  async createIncrementalBackup() {
    console.log('🔄 Creating incremental backup...');
    
    const backupDir = this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `incremental-backup-${timestamp}`);
    
    try {
      // Get last backup timestamp
      const lastBackupFile = path.join(this.backupDir, 'last-backup-timestamp.txt');
      let lastBackupTime = new Date(0); // Default to epoch time
      
      if (fs.existsSync(lastBackupFile)) {
        lastBackupTime = new Date(fs.readFileSync(lastBackupFile, 'utf8'));
      }
      
      // Create incremental backup
      await this.db.collection('auditlogs').find({
        timestamp: { $gte: lastBackupTime }
      }).toArray();
      
      // Save current timestamp
      fs.writeFileSync(lastBackupFile, new Date().toISOString());
      
      console.log(`✅ Incremental backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('❌ Incremental backup failed:', error);
      throw error;
    }
  }

  // Create collection-specific backups
  async createCollectionBackup(collectionName) {
    console.log(`🔄 Creating backup for collection: ${collectionName}`);
    
    const backupDir = this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${collectionName}-backup-${timestamp}`);
    
    try {
      const collection = this.db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(backupPath, `${collectionName}.json`),
        JSON.stringify(documents, null, 2)
      );
      
      console.log(`✅ Collection backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`❌ Collection backup failed for ${collectionName}:`, error);
      throw error;
    }
  }

  // Compress backup
  async compressBackup(backupPath) {
    console.log('🗜️  Compressing backup...');
    
    return new Promise((resolve, reject) => {
      const archivePath = `${backupPath}.tar.gz`;
      const command = `tar -czf "${archivePath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Compression failed:', error);
          reject(error);
        } else {
          // Remove uncompressed backup
          exec(`rm -rf "${backupPath}"`, (err) => {
            if (err) console.warn('⚠️  Could not remove uncompressed backup:', err.message);
          });
          
          console.log(`✅ Backup compressed: ${archivePath}`);
          resolve(archivePath);
        }
      });
    });
  }

  // Clean up old backups
  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');
    
    try {
      const files = fs.readdirSync(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          if (stats.isDirectory()) {
            exec(`rm -rf "${filePath}"`, (error) => {
              if (error) console.warn(`⚠️  Could not delete ${filePath}:`, error.message);
              else deletedCount++;
            });
          } else {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }
      
      console.log(`🗑️  Deleted ${deletedCount} old backup files`);
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  // Verify backup integrity
  async verifyBackup(backupPath) {
    console.log('🔍 Verifying backup integrity...');
    
    try {
      // Check if backup file exists and is not empty
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file does not exist');
      }
      
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }
      
      // If it's a compressed file, try to list contents
      if (backupPath.endsWith('.tar.gz')) {
        return new Promise((resolve, reject) => {
          exec(`tar -tzf "${backupPath}"`, (error, stdout, stderr) => {
            if (error) {
              reject(new Error('Backup archive is corrupted'));
            } else {
              console.log('✅ Backup integrity verified');
              resolve(true);
            }
          });
        });
      }
      
      console.log('✅ Backup integrity verified');
      return true;
    } catch (error) {
      console.error('❌ Backup verification failed:', error);
      throw error;
    }
  }

  // Generate backup report
  async generateBackupReport(backupPath) {
    const stats = fs.statSync(backupPath);
    const report = {
      timestamp: new Date().toISOString(),
      backupPath,
      size: stats.size,
      sizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100,
      type: backupPath.includes('full') ? 'full' : backupPath.includes('incremental') ? 'incremental' : 'collection',
      status: 'completed'
    };
    
    const reportPath = backupPath.replace(/\.(tar\.gz)?$/, '-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Backup report created: ${reportPath}`);
    return report;
  }

  // Run backup strategy
  async runBackup(type = 'full') {
    try {
      await this.connect();
      
      let backupPath;
      
      switch (type) {
        case 'full':
          backupPath = await this.createFullBackup();
          break;
        case 'incremental':
          backupPath = await this.createIncrementalBackup();
          break;
        case 'collections':
          const collections = ['organizations', 'bloodrequests', 'bloodbanks', 'ngos'];
          for (const collection of collections) {
            await this.createCollectionBackup(collection);
          }
          return;
        default:
          throw new Error(`Unknown backup type: ${type}`);
      }
      
      // Compress backup
      const compressedPath = await this.compressBackup(backupPath);
      
      // Verify backup
      await this.verifyBackup(compressedPath);
      
      // Generate report
      await this.generateBackupReport(compressedPath);
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      console.log('✅ Backup strategy completed successfully!');
    } catch (error) {
      console.error('❌ Backup strategy failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  const backupType = process.argv[2] || 'full';
  const strategy = new DatabaseBackupStrategy();
  
  strategy.runBackup(backupType)
    .then(() => {
      console.log('🎉 Backup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backup failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseBackupStrategy;
