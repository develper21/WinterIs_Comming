#!/bin/bash

# BloodBank Auto-scaling Script
# Usage: ./autoscaling.sh [action] [service] [scale]

set -e

# Configuration
ENVIRONMENT=${1:-production}
ACTION=${2:-status}
SERVICE=${3:-backend}
SCALE=${4:-2}
COMPOSE_FILE="docker-compose.autoscaling.yml"
LOG_FILE="/var/log/bloodbank/autoscaling.log"

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

# Get current service status
get_service_status() {
    local service=$1
    docker-compose -f $COMPOSE_FILE ps $service | grep -v "NAME\|----" | awk '{print $1, $2, $3, $4}'
}

# Get service metrics
get_service_metrics() {
    local service=$1
    local container_ids=$(docker-compose -f $COMPOSE_FILE ps -q $service)
    
    if [ -z "$container_ids" ]; then
        echo "No running containers found for $service"
        return
    fi
    
    echo "=== $service Metrics ==="
    for container_id in $container_ids; do
        echo "Container: $(docker inspect --format='{{.Name}}' $container_id)"
        echo "Status: $(docker inspect --format='{{.State.Status}}' $container_id)"
        echo "CPU: $(docker stats --no-stream --format 'table {{.CPUPerc}}' $container_id | tail -n1)"
        echo "Memory: $(docker stats --no-stream --format 'table {{.MemUsage}}' $container_id | tail -n1)"
        echo "---"
    done
}

# Scale service
scale_service() {
    local service=$1
    local scale=$2
    
    log "Scaling $service to $scale replicas..."
    
    if docker-compose -f $COMPOSE_FILE up -d --scale $service=$scale; then
        log "✅ Successfully scaled $service to $scale replicas"
        
        # Wait for containers to be ready
        sleep 10
        
        # Verify scaling
        local current_scale=$(docker-compose -f $COMPOSE_FILE ps -q $service | wc -l)
        if [ "$current_scale" -eq "$scale" ]; then
            log "✅ Scaling verified: $service has $current_scale running replicas"
        else
            log "⚠️  Scaling warning: Expected $scale replicas, but $current_scale are running"
        fi
    else
        error_exit "Failed to scale $service to $scale replicas"
    fi
}

# Auto-scale based on metrics
auto_scale() {
    local service=$1
    local threshold_cpu=${AUTO_SCALE_CPU_THRESHOLD:-70}
    local threshold_memory=${AUTO_SCALE_MEMORY_THRESHOLD:-80}
    local min_scale=${MIN_SCALE:-1}
    local max_scale=${MAX_SCALE:-5}
    
    log "Auto-scaling $service based on metrics..."
    
    # Get current metrics
    local container_ids=$(docker-compose -f $COMPOSE_FILE ps -q $service)
    local current_scale=$(echo "$container_ids" | wc -l)
    
    if [ -z "$container_ids" ]; then
        log "No running containers found for $service"
        return
    fi
    
    # Calculate average CPU and memory usage
    local total_cpu=0
    local total_memory=0
    local count=0
    
    for container_id in $container_ids; do
        local stats=$(docker stats --no-stream --format 'table {{.CPUPerc}}\t{{.MemPerc}}' $container_id | tail -n1)
        local cpu=$(echo "$stats" | awk '{print $1}' | sed 's/%//')
        local memory=$(echo "$stats" | awk '{print $2}' | sed 's/%//')
        
        total_cpu=$(echo "$total_cpu + $cpu" | bc)
        total_memory=$(echo "$total_memory + $memory" | bc)
        count=$((count + 1))
    done
    
    local avg_cpu=$(echo "scale=2; $total_cpu / $count" | bc)
    local avg_memory=$(echo "scale=2; $total_memory / $count" | bc)
    
    log "Current metrics for $service: CPU=${avg_cpu}%, Memory=${avg_memory}%, Replicas=${current_scale}"
    
    # Scaling logic
    local new_scale=$current_scale
    
    # Scale up if thresholds exceeded
    if (( $(echo "$avg_cpu > $threshold_cpu" | bc -l) )) || (( $(echo "$avg_memory > $threshold_memory" | bc -l) )); then
        if [ "$current_scale" -lt "$max_scale" ]; then
            new_scale=$((current_scale + 1))
            log "📈 Scaling up $service: $current_scale -> $new_scale (CPU: ${avg_cpu}%, Memory: ${avg_memory}%)"
        else
            log "⚠️  Maximum scale reached for $service ($max_scale)"
        fi
    # Scale down if under thresholds
    elif (( $(echo "$avg_cpu < 30" | bc -l) )) && (( $(echo "$avg_memory < 50" | bc -l) )); then
        if [ "$current_scale" -gt "$min_scale" ]; then
            new_scale=$((current_scale - 1))
            log "📉 Scaling down $service: $current_scale -> $new_scale (CPU: ${avg_cpu}%, Memory: ${avg_memory}%)"
        else
            log "⚠️  Minimum scale reached for $service ($min_scale)"
        fi
    else
        log "✅ No scaling needed for $service (CPU: ${avg_cpu}%, Memory: ${avg_memory}%)"
    fi
    
    # Apply scaling if needed
    if [ "$new_scale" -ne "$current_scale" ]; then
        scale_service $service $new_scale
    fi
}

# Health check
health_check() {
    local service=$1
    
    log "Performing health check for $service..."
    
    local container_ids=$(docker-compose -f $COMPOSE_FILE ps -q $service)
    local healthy=0
    local total=0
    
    for container_id in $container_ids; do
        total=$((total + 1))
        local health=$(docker inspect --format='{{.State.Health.Status}}' $container_id 2>/dev/null || echo "unknown")
        
        if [ "$health" = "healthy" ]; then
            healthy=$((healthy + 1))
        else
            log "⚠️  Container $(docker inspect --format='{{.Name}}' $container_id) health: $health"
        fi
    done
    
    if [ "$healthy" -eq "$total" ]; then
        log "✅ All $total containers for $service are healthy"
        return 0
    else
        log "❌ $healthy/$total containers for $service are healthy"
        return 1
    fi
}

# Show status
show_status() {
    log "=== BloodBank Auto-scaling Status ==="
    echo "Environment: $ENVIRONMENT"
    echo "Compose File: $COMPOSE_FILE"
    echo ""
    
    # Show service status
    for service in backend frontend nginx mongodb redis-master redis-slave; do
        echo "=== $service ==="
        get_service_status $service
        echo ""
    done
    
    # Show system metrics
    echo "=== System Metrics ==="
    get_service_metrics backend
    get_service_metrics frontend
    echo ""
    
    # Show health status
    echo "=== Health Status ==="
    for service in backend frontend nginx; do
        health_check $service
    done
}

# Main execution
case $ACTION in
    "status")
        show_status
        ;;
    "scale")
        scale_service $SERVICE $SCALE
        ;;
    "auto-scale")
        auto_scale $SERVICE
        ;;
    "health")
        health_check $SERVICE
        ;;
    "metrics")
        get_service_metrics $SERVICE
        ;;
    *)
        echo "Usage: $0 [action] [service] [scale]"
        echo ""
        echo "Actions:"
        echo "  status                    - Show overall status"
        echo "  scale [service] [scale]   - Scale service to specified replicas"
        echo "  auto-scale [service]      - Auto-scale based on metrics"
        echo "  health [service]          - Check service health"
        echo "  metrics [service]         - Show service metrics"
        echo ""
        echo "Services: backend, frontend, nginx, mongodb, redis-master, redis-slave"
        echo ""
        echo "Environment Variables:"
        echo "  AUTO_SCALE_CPU_THRESHOLD     - CPU threshold for scaling (default: 70)"
        echo "  AUTO_SCALE_MEMORY_THRESHOLD  - Memory threshold for scaling (default: 80)"
        echo "  MIN_SCALE                   - Minimum replicas (default: 1)"
        echo "  MAX_SCALE                   - Maximum replicas (default: 5)"
        exit 1
        ;;
esac
