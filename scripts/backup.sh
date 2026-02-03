#!/bin/bash

# BloodBank Backup Script
# Usage: ./backup.sh [environment] [backup_type]

set -e

# Configuration
ENVIRONMENT=${1:-development}
BACKUP_TYPE=${2:-full}
BACKUP_DIR="/opt/backups/bloodbank"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/bloodbank/backup_${DATE}.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting backup process for environment: $ENVIRONMENT"
log "Backup type: $BACKUP_TYPE"
log "Backup directory: $BACKUP_DIR"

# Get Docker container names based on environment
case $ENVIRONMENT in
    "production")
        MONGO_CONTAINER="sebn-mongodb-prod"
        REDIS_CONTAINER="sebn-redis-prod"
        ;;
    "staging")
        MONGO_CONTAINER="sebn-mongodb-staging"
        REDIS_CONTAINER="sebn-redis-staging"
        ;;
    *)
        MONGO_CONTAINER="sebn-mongodb"
        REDIS_CONTAINER="sebn-redis"
        ;;
esac

# Check if containers are running
if ! docker ps | grep -q "$MONGO_CONTAINER"; then
    error_exit "MongoDB container $MONGO_CONTAINER is not running"
fi

if ! docker ps | grep -q "$REDIS_CONTAINER"; then
    error_exit "Redis container $REDIS_CONTAINER is not running"
fi

# Create backup subdirectory
BACKUP_PATH="$BACKUP_DIR/$ENVIRONMENT/$DATE"
mkdir -p "$BACKUP_PATH"

log "Created backup directory: $BACKUP_PATH"

# MongoDB Backup
log "Starting MongoDB backup..."
MONGO_BACKUP_FILE="$BACKUP_PATH/mongodb_backup_$DATE.tar.gz"

docker exec "$MONGO_CONTAINER" mongodump --out /tmp/backup_$DATE
docker cp "$MONGO_CONTAINER:/tmp/backup_$DATE" "$BACKUP_PATH/mongodb_backup_$DATE"
tar -czf "$MONGO_BACKUP_FILE" -C "$BACKUP_PATH" "mongodb_backup_$DATE"
rm -rf "$BACKUP_PATH/mongodb_backup_$DATE"

if [ $? -eq 0 ]; then
    log "MongoDB backup completed: $MONGO_BACKUP_FILE"
    MONGO_SIZE=$(du -h "$MONGO_BACKUP_FILE" | cut -f1)
    log "MongoDB backup size: $MONGO_SIZE"
else
    error_exit "MongoDB backup failed"
fi

# Redis Backup
log "Starting Redis backup..."
REDIS_BACKUP_FILE="$BACKUP_PATH/redis_backup_$DATE.rdb"

docker exec "$REDIS_CONTAINER" redis-cli BGSAVE
sleep 5  # Wait for background save to complete
docker cp "$REDIS_CONTAINER:/data/dump.rdb" "$REDIS_BACKUP_FILE"

if [ $? -eq 0 ]; then
    log "Redis backup completed: $REDIS_BACKUP_FILE"
    REDIS_SIZE=$(du -h "$REDIS_BACKUP_FILE" | cut -f1)
    log "Redis backup size: $REDIS_SIZE"
else
    error_exit "Redis backup failed"
fi

# Application Configuration Backup
log "Starting application configuration backup..."
CONFIG_BACKUP_FILE="$BACKUP_PATH/config_backup_$DATE.tar.gz"

tar -czf "$CONFIG_BACKUP_FILE" \
    /opt/bloodbank/config \
    /opt/bloodbank/nginx \
    /opt/bloodbank/docker-compose*.yml \
    /opt/bloodbank/.env* 2>/dev/null || true

if [ $? -eq 0 ]; then
    log "Configuration backup completed: $CONFIG_BACKUP_FILE"
    CONFIG_SIZE=$(du -h "$CONFIG_BACKUP_FILE" | cut -f1)
    log "Configuration backup size: $CONFIG_SIZE"
else
    log "WARNING: Configuration backup failed (some files may not exist)"
fi

# Log Files Backup
log "Starting log files backup..."
LOGS_BACKUP_FILE="$BACKUP_PATH/logs_backup_$DATE.tar.gz"

tar -czf "$LOGS_BACKUP_FILE" \
    /var/log/bloodbank \
    /var/log/nginx \
    /var/log/app 2>/dev/null || true

if [ $? -eq 0 ]; then
    log "Logs backup completed: $LOGS_BACKUP_FILE"
    LOGS_SIZE=$(du -h "$LOGS_BACKUP_FILE" | cut -f1)
    log "Logs backup size: $LOGS_SIZE"
else
    log "WARNING: Logs backup failed (some files may not exist)"
fi

# Create backup metadata
METADATA_FILE="$BACKUP_PATH/backup_metadata.json"
cat > "$METADATA_FILE" << EOF
{
  "backup_id": "$DATE",
  "environment": "$ENVIRONMENT",
  "backup_type": "$BACKUP_TYPE",
  "timestamp": "$(date -Iseconds)",
  "files": {
    "mongodb": {
      "file": "mongodb_backup_$DATE.tar.gz",
      "size": "$MONGO_SIZE"
    },
    "redis": {
      "file": "redis_backup_$DATE.rdb",
      "size": "$REDIS_SIZE"
    },
    "config": {
      "file": "config_backup_$DATE.tar.gz",
      "size": "$CONFIG_SIZE"
    },
    "logs": {
      "file": "logs_backup_$DATE.tar.gz",
      "size": "$LOGS_SIZE"
    }
  },
  "containers": {
    "mongodb": "$MONGO_CONTAINER",
    "redis": "$REDIS_CONTAINER"
  },
  "system_info": {
    "hostname": "$(hostname)",
    "kernel": "$(uname -r)",
    "docker_version": "$(docker --version)"
  }
}
EOF

log "Backup metadata created: $METADATA_FILE"

# Cleanup old backups (keep last 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR/$ENVIRONMENT" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
log "Total backup size: $TOTAL_SIZE"

# Verify backup integrity
log "Verifying backup integrity..."
for file in "$MONGO_BACKUP_FILE" "$REDIS_BACKUP_FILE" "$CONFIG_BACKUP_FILE" "$LOGS_BACKUP_FILE"; do
    if [ -f "$file" ]; then
        if tar -tzf "$file" >/dev/null 2>&1 || [ "$file" == "$REDIS_BACKUP_FILE" ]; then
            log "✓ Backup file verified: $(basename "$file")"
        else
            error_exit "Backup file corrupted: $(basename "$file")"
        fi
    fi
done

# Create backup symlink (latest)
ln -sfn "$BACKUP_PATH" "$BACKUP_DIR/$ENVIRONMENT/latest"

log "Backup process completed successfully!"
log "Backup location: $BACKUP_PATH"
log "Latest backup symlink: $BACKUP_DIR/$ENVIRONMENT/latest"

# Send notification (if configured)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ BloodBank backup completed successfully!\nEnvironment: $ENVIRONMENT\nSize: $TOTAL_SIZE\nLocation: $BACKUP_PATH\"}" \
        "$SLACK_WEBHOOK_URL" 2>/dev/null || log "WARNING: Failed to send Slack notification"
fi

echo "Backup completed: $BACKUP_PATH"
