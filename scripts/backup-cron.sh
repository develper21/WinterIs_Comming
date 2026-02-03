#!/bin/bash

# BloodBank Automated Backup Script (for cron)
# This script is designed to be run by cron for automated backups

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
LOG_FILE="/var/log/bloodbank/cron_backup.log"
LOCK_FILE="/var/run/bloodbank_backup.lock"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if backup is already running
if [ -f "$LOCK_FILE" ]; then
    log "Backup already running (lock file exists)"
    exit 1
fi

# Create lock file
touch "$LOCK_FILE"

# Cleanup function
cleanup() {
    rm -f "$LOCK_FILE"
    log "Lock file removed"
}

# Set trap for cleanup
trap cleanup EXIT

log "Starting automated backup process"

# Run backup script
if "$BACKUP_SCRIPT" production full >> "$LOG_FILE" 2>&1; then
    log "✅ Automated backup completed successfully"
    
    # Send success notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"✅ Automated BloodBank backup completed successfully"}' \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || log "Failed to send Slack notification"
    fi
else
    log "❌ Automated backup failed"
    
    # Send failure notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"❌ Automated BloodBank backup failed!"}' \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || log "Failed to send Slack notification"
    fi
    
    exit 1
fi

log "Automated backup process finished"
