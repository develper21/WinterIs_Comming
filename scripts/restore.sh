#!/bin/bash

# BloodBank Restore Script
# Usage: ./restore.sh [environment] [backup_id]

set -e

# Configuration
ENVIRONMENT=${1:-development}
BACKUP_ID=${2:-latest}
BACKUP_DIR="/opt/backups/bloodbank"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/bloodbank/restore_${DATE}.log"

# Create log directory
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

# Confirmation prompt
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error_exit "Restore cancelled by user"
    fi
}

log "Starting restore process for environment: $ENVIRONMENT"
log "Backup ID: $BACKUP_ID"

# Determine backup path
if [ "$BACKUP_ID" = "latest" ]; then
    BACKUP_PATH="$BACKUP_DIR/$ENVIRONMENT/latest"
    if [ ! -L "$BACKUP_PATH" ]; then
        error_exit "Latest backup symlink not found"
    fi
    BACKUP_PATH=$(readlink -f "$BACKUP_PATH")
else
    BACKUP_PATH="$BACKUP_DIR/$ENVIRONMENT/$BACKUP_ID"
fi

if [ ! -d "$BACKUP_PATH" ]; then
    error_exit "Backup directory not found: $BACKUP_PATH"
fi

log "Using backup: $BACKUP_PATH"

# Load backup metadata
METADATA_FILE="$BACKUP_PATH/backup_metadata.json"
if [ ! -f "$METADATA_FILE" ]; then
    error_exit "Backup metadata not found: $METADATA_FILE"
fi

log "Loading backup metadata..."
BACKUP_ENVIRONMENT=$(jq -r '.environment' "$METADATA_FILE")
BACKUP_TYPE=$(jq -r '.backup_type' "$METADATA_FILE")
BACKUP_TIMESTAMP=$(jq -r '.timestamp' "$METADATA_FILE")

log "Backup details:"
log "  Environment: $BACKUP_ENVIRONMENT"
log "  Type: $BACKUP_TYPE"
log "  Timestamp: $BACKUP_TIMESTAMP"

# Confirm restore
confirm "⚠️  WARNING: This will replace all current data in $ENVIRONMENT environment. Continue?"

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

# Create restore directory
RESTORE_DIR="/tmp/bloodbank_restore_$DATE"
mkdir -p "$RESTORE_DIR"

log "Created restore directory: $RESTORE_DIR"

# Stop application services during restore
log "Stopping application services..."
docker-compose -f /opt/bloodbank/docker-compose.$ENVIRONMENT.yml stop backend frontend nginx 2>/dev/null || true

# Restore MongoDB
log "Starting MongoDB restore..."
MONGO_BACKUP_FILE=$(jq -r '.files.mongodb.file' "$METADATA_FILE")
if [ -f "$BACKUP_PATH/$MONGO_BACKUP_FILE" ]; then
    log "Extracting MongoDB backup..."
    tar -xzf "$BACKUP_PATH/$MONGO_BACKUP_FILE" -C "$RESTORE_DIR"
    
    MONGO_EXTRACTED_DIR=$(find "$RESTORE_DIR" -name "mongodb_backup_*" -type d | head -1)
    if [ -n "$MONGO_EXTRACTED_DIR" ]; then
        log "Restoring MongoDB data..."
        docker cp "$MONGO_EXTRACTED_DIR" "$MONGO_CONTAINER:/tmp/restore_$DATE"
        docker exec "$MONGO_CONTAINER" mongorestore --drop /tmp/restore_$DATE
        docker exec "$MONGO_CONTAINER" rm -rf /tmp/restore_$DATE
        
        log "✅ MongoDB restore completed"
    else
        error_exit "MongoDB backup extraction failed"
    fi
else
    error_exit "MongoDB backup file not found: $MONGO_BACKUP_FILE"
fi

# Restore Redis
log "Starting Redis restore..."
REDIS_BACKUP_FILE=$(jq -r '.files.redis.file' "$METADATA_FILE")
if [ -f "$BACKUP_PATH/$REDIS_BACKUP_FILE" ]; then
    log "Restoring Redis data..."
    docker cp "$BACKUP_PATH/$REDIS_BACKUP_FILE" "$REDIS_CONTAINER:/data/dump.rdb"
    docker restart "$REDIS_CONTAINER"
    
    # Wait for Redis to be ready
    sleep 5
    if docker exec "$REDIS_CONTAINER" redis-cli ping | grep -q "PONG"; then
        log "✅ Redis restore completed"
    else
        error_exit "Redis restore failed - service not responding"
    fi
else
    error_exit "Redis backup file not found: $REDIS_BACKUP_FILE"
fi

# Restore Configuration (optional)
read -p "Restore configuration files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Starting configuration restore..."
    CONFIG_BACKUP_FILE=$(jq -r '.files.config.file' "$METADATA_FILE")
    if [ -f "$BACKUP_PATH/$CONFIG_BACKUP_FILE" ]; then
        log "Extracting configuration backup..."
        tar -xzf "$BACKUP_PATH/$CONFIG_BACKUP_FILE" -C "$RESTORE_DIR"
        
        log "Restoring configuration files..."
        if [ -d "$RESTORE_DIR/opt/bloodbank/config" ]; then
            cp -r "$RESTORE_DIR/opt/bloodbank/config"/* /opt/bloodbank/config/ 2>/dev/null || true
        fi
        if [ -d "$RESTORE_DIR/opt/bloodbank/nginx" ]; then
            cp -r "$RESTORE_DIR/opt/bloodbank/nginx"/* /opt/bloodbank/nginx/ 2>/dev/null || true
        fi
        
        log "✅ Configuration restore completed"
    else
        log "WARNING: Configuration backup file not found: $CONFIG_BACKUP_FILE"
    fi
fi

# Restore Logs (optional)
read -p "Restore log files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Starting logs restore..."
    LOGS_BACKUP_FILE=$(jq -r '.files.logs.file' "$METADATA_FILE")
    if [ -f "$BACKUP_PATH/$LOGS_BACKUP_FILE" ]; then
        log "Extracting logs backup..."
        tar -xzf "$BACKUP_PATH/$LOGS_BACKUP_FILE" -C "$RESTORE_DIR"
        
        log "Restoring log files..."
        if [ -d "$RESTORE_DIR/var/log/bloodbank" ]; then
            cp -r "$RESTORE_DIR/var/log/bloodbank"/* /var/log/bloodbank/ 2>/dev/null || true
        fi
        if [ -d "$RESTORE_DIR/var/log/nginx" ]; then
            cp -r "$RESTORE_DIR/var/log/nginx"/* /var/log/nginx/ 2>/dev/null || true
        fi
        
        log "✅ Logs restore completed"
    else
        log "WARNING: Logs backup file not found: $LOGS_BACKUP_FILE"
    fi
fi

# Start application services
log "Starting application services..."
docker-compose -f /opt/bloodbank/docker-compose.$ENVIRONMENT.yml up -d

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 30

# Health checks
log "Performing health checks..."

# Check MongoDB
if docker exec "$MONGO_CONTAINER" mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    log "✅ MongoDB health check passed"
else
    log "❌ MongoDB health check failed"
fi

# Check Redis
if docker exec "$REDIS_CONTAINER" redis-cli ping | grep -q "PONG"; then
    log "✅ Redis health check passed"
else
    log "❌ Redis health check failed"
fi

# Check application
if curl -f http://localhost/api/health >/dev/null 2>&1; then
    log "✅ Application health check passed"
else
    log "❌ Application health check failed"
fi

# Cleanup
log "Cleaning up restore directory..."
rm -rf "$RESTORE_DIR"

# Create restore metadata
RESTORE_METADATA_FILE="/var/log/bloodbank/restore_metadata_$DATE.json"
cat > "$RESTORE_METADATA_FILE" << EOF
{
  "restore_id": "$DATE",
  "environment": "$ENVIRONMENT",
  "backup_id": "$BACKUP_ID",
  "backup_timestamp": "$BACKUP_TIMESTAMP",
  "restore_timestamp": "$(date -Iseconds)",
  "backup_path": "$BACKUP_PATH",
  "status": "completed",
  "services_restored": ["mongodb", "redis"]
}
EOF

log "Restore metadata created: $RESTORE_METADATA_FILE"

# Cleanup restore directory
rm -rf "$RESTORE_DIR"

log "Restore process completed successfully!"
log "Restored from backup: $BACKUP_PATH"
log "Environment: $ENVIRONMENT"

# Send notification (if configured)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ BloodBank restore completed successfully!\nEnvironment: $ENVIRONMENT\nFrom backup: $BACKUP_ID\"}" \
        "$SLACK_WEBHOOK_URL" 2>/dev/null || log "WARNING: Failed to send Slack notification"
fi

echo "Restore completed successfully!"
