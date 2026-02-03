#!/bin/bash

# CDN Setup Script for BloodBank
# This script sets up CDN configuration and optimization

set -e

# Configuration
DOMAIN=${1:-"bloodbank.yourdomain.com"}
CDN_DOMAIN=${2:-"cdn.bloodbank.yourdomain.com"}
ENVIRONMENT=${3:-"production"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error "This script should not be run as root"
    exit 1
fi

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        log "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install npm packages for CDN optimization
    npm install -g sharp imagemin-cli svgo terser clean-css-cli
    
    log "Dependencies installed successfully"
}

# Setup CDN directories
setup_directories() {
    log "Setting up CDN directories..."
    
    mkdir -p cdn/{assets,images,fonts,scripts,styles}
    mkdir -p cdn/cache/{nginx,varnish}
    mkdir -p cdn/logs
    mkdir -p cdn/config
    
    log "CDN directories created"
}

# Optimize images
optimize_images() {
    log "Optimizing images..."
    
    if [ -d "Frontend/src/assets/images" ]; then
        find Frontend/src/assets/images -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read img; do
            imagemin "$img" --out-dir="cdn/images" --plugin=mozjpeg --plugin=pngquant
        done
        log "Images optimized and copied to CDN"
    else
        warn "No images directory found"
    fi
}

# Optimize JavaScript
optimize_scripts() {
    log "Optimizing JavaScript files..."
    
    if [ -d "Frontend/src" ]; then
        find Frontend/src -name "*.js" -o -name "*.jsx" | while read script; do
            terser "$script" -o "cdn/scripts/$(basename "$script").min.js" --compress --mangle
        done
        log "JavaScript files optimized and copied to CDN"
    else
        warn "No JavaScript files found"
    fi
}

# Optimize CSS
optimize_styles() {
    log "Optimizing CSS files..."
    
    if [ -d "Frontend/src" ]; then
        find Frontend/src -name "*.css" | while read style; do
            cleancss "$style" -o "cdn/styles/$(basename "$style").min.css"
        done
        log "CSS files optimized and copied to CDN"
    else
        warn "No CSS files found"
    fi
}

# Generate CDN manifest
generate_manifest() {
    log "Generating CDN manifest..."
    
    cat > cdn/manifest.json << EOF
{
  "version": "$(date +%Y%m%d%H%M%S)",
  "domain": "$CDN_DOMAIN",
  "assets": {
    "images": {},
    "scripts": {},
    "styles": {},
    "fonts": {}
  },
  "cache": {
    "images": "1y",
    "scripts": "1y",
    "styles": "1y",
    "fonts": "1y"
  }
}
EOF

    # Add file hashes to manifest
    find cdn -type f -name "*.min.*" | while read file; do
        hash=$(sha256sum "$file" | cut -d' ' -f1)
        rel_path=$(echo "$file" | sed 's|^cdn/||')
        type=$(echo "$rel_path" | cut -d'/' -f1)
        
        # Update JSON (simplified approach)
        echo "  \"$rel_path\": \"$hash\"," >> cdn/manifest.tmp
    done
    
    log "CDN manifest generated"
}

# Setup CloudFlare configuration
setup_cloudflare() {
    log "Setting up CloudFlare configuration..."
    
    cat > cdn/config/cloudflare.json << EOF
{
  "zone": "$DOMAIN",
  "cdn_domain": "$CDN_DOMAIN",
  "cache_rules": [
    {
      "name": "Static Assets",
      "target": "*.jpg,*.jpeg,*.png,*.gif,*.svg,*.woff,*.woff2,*.ttf,*.eot",
      "cache_ttl": 31536000,
      "browser_cache_ttl": 31536000,
      "edge_cache_ttl": 31536000
    },
    {
      "name": "JavaScript & CSS",
      "target": "*.js, *.css",
      "cache_ttl": 2592000,
      "browser_cache_ttl": 2592000,
      "edge_cache_ttl": 2592000
    },
    {
      "name": "API Responses",
      "target": "/api/*",
      "cache_ttl": 300,
      "browser_cache_ttl": 0,
      "edge_cache_ttl": 300
    }
  ],
  "page_rules": [
    {
      "url": "$DOMAIN/*",
      "settings": {
        "cache_level": "cache_everything",
        "edge_cache_ttl": 7200,
        "browser_cache_ttl": 7200
      }
    },
    {
      "url": "$DOMAIN/api/*",
      "settings": {
        "cache_level": "bypass",
        "browser_cache_ttl": 0
      }
    }
  ],
  "security": {
    "ssl": "strict",
    "hsts": {
      "enabled": true,
      "max_age": 31536000,
      "include_subdomains": true,
      "preload": true
    }
  }
}
EOF

    log "CloudFlare configuration created"
}

# Setup Nginx for CDN
setup_nginx_cdn() {
    log "Setting up Nginx CDN configuration..."
    
    # Copy CDN configuration
    cp nginx/nginx.cdn.conf cdn/config/
    
    # Create CDN-specific Docker Compose file
    cat > cdn/docker-compose.yml << EOF
version: '3.8'

services:
  nginx-cdn:
    image: nginx:alpine
    container_name: bloodbank-cdn
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.cdn.conf:/etc/nginx/nginx.conf:ro
      - ./assets:/var/www/cdn:ro
      - ./cache/nginx:/var/cache/nginx
      - ./logs/nginx:/var/log/nginx
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - cdn-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/cdn-status"]
      interval: 30s
      timeout: 10s
      retries: 3

  varnish:
    image: varnish:7-alpine
    container_name: bloodbank-varnish
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./config/varnish.vcl:/etc/varnish/default.vcl:ro
      - ./cache/varnish:/var/lib/varnish
    networks:
      - cdn-network
    depends_on:
      - nginx-cdn

networks:
  cdn-network:
    driver: bridge
EOF

    log "Nginx CDN configuration created"
}

# Create Varnish configuration
create_varnish_config() {
    log "Creating Varnish configuration..."
    
    cat > cdn/config/varnish.vcl << EOF
vcl 4.0;

backend default {
    .host = "nginx-cdn";
    .port = "80";
}

sub vcl_recv {
    # Set X-Forwarded-For header
    if (req.restarts == 0) {
        if (req.http.X-Forwarded-For) {
            set req.http.X-Forwarded-For = req.http.X-Forwarded-For + ", " + client.ip;
        } else {
            set req.http.X-Forwarded-For = client.ip;
        }
    }

    # Normalize Accept-Encoding header
    if (req.http.Accept-Encoding) {
        if (req.url ~ "\.(jpg|jpeg|png|gif|gz|tgz|bz2|tbz|zip|rar|7z|mp3|mp4|ogg|webm|flv|swf|woff|woff2|ttf|eot|svg)$") {
            set req.http.Accept-Encoding = "gzip";
        } else {
            unset req.http.Accept-Encoding;
        }
    }

    # Cache static files
    if (req.url ~ "\.(jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot|css|js)$") {
        unset req.http.Cookie;
        unset req.http.Authorization;
        return (hash);
    }

    # Don't cache API requests
    if (req.url ~ "^/api/") {
        return (pass);
    }

    # Don't cache admin pages
    if (req.url ~ "^/admin/") {
        return (pass);
    }

    return (hash);
}

sub vcl_backend_response {
    # Set cache headers for static files
    if (beresp.http.Content-Type ~ "image/") {
        set beresp.ttl = 1y;
        set beresp.http.Cache-Control = "public, max-age=31536000";
    } else if (beresp.http.Content-Type ~ "text/css") {
        set beresp.ttl = 30d;
        set beresp.http.Cache-Control = "public, max-age=2592000";
    } else if (beresp.http.Content-Type ~ "application/javascript") {
        set beresp.ttl = 30d;
        set beresp.http.Cache-Control = "public, max-age=2592000";
    }

    # Don't cache error responses
    if (beresp.status >= 400) {
        set beresp.ttl = 0s;
        set beresp.http.Cache-Control = "no-cache, no-store, must-revalidate";
    }

    return (deliver);
}

sub vcl_deliver {
    # Add cache status header
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }

    # Add CDN information
    set resp.http.X-CDN = "BloodBank CDN";
    set resp.http.X-CDN-Version = "1.0";
    
    return (deliver);
}
EOF

    log "Varnish configuration created"
}

# Generate CDN deployment script
create_deployment_script() {
    log "Creating CDN deployment script..."
    
    cat > cdn/deploy.sh << 'EOF'
#!/bin/bash

# CDN Deployment Script

set -e

echo "🚀 Deploying CDN..."

# Build and start CDN services
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost/cdn-status > /dev/null 2>&1; then
    echo "✅ CDN is running successfully!"
else
    echo "❌ CDN health check failed!"
    exit 1
fi

echo "🎉 CDN deployment completed!"
echo "🌐 CDN is available at: http://localhost"
echo "📊 Varnish admin interface: http://localhost:8080"
EOF

    chmod +x cdn/deploy.sh
    log "CDN deployment script created"
}

# Create monitoring script
create_monitoring_script() {
    log "Creating CDN monitoring script..."
    
    cat > cdn/monitor.sh << 'EOF'
#!/bin/bash

# CDN Monitoring Script

echo "📊 CDN Monitoring Report"
echo "======================="

# Check CDN status
echo "🔍 CDN Status:"
curl -s http://localhost/cdn-status || echo "❌ CDN is down"

# Check cache hit rate
echo ""
echo "💾 Cache Hit Rate:"
curl -s -H "X-CDN-Debug: 1" http://localhost/ | grep -o "X-Cache: [A-Z]*" | sort | uniq -c

# Check response times
echo ""
echo "⚡ Response Times:"
for url in "http://localhost/" "http://localhost/api/health"; do
    echo -n "$url: "
    curl -o /dev/null -s -w "%{time_total}\n" "$url"
done

# Check disk usage
echo ""
echo "💾 Disk Usage:"
du -sh cdn/cache/* 2>/dev/null || echo "No cache directories found"

echo ""
echo "📈 Monitoring completed!"
EOF

    chmod +x cdn/monitor.sh
    log "CDN monitoring script created"
}

# Main execution
main() {
    log "Starting CDN setup for BloodBank..."
    log "Domain: $DOMAIN"
    log "CDN Domain: $CDN_DOMAIN"
    log "Environment: $ENVIRONMENT"
    
    install_dependencies
    setup_directories
    optimize_images
    optimize_scripts
    optimize_styles
    generate_manifest
    setup_cloudflare
    setup_nginx_cdn
    create_varnish_config
    create_deployment_script
    create_monitoring_script
    
    log "✅ CDN setup completed successfully!"
    log ""
    log "Next steps:"
    log "1. Review CDN configuration in cdn/config/"
    log "2. Deploy CDN: cd cdn && ./deploy.sh"
    log "3. Monitor CDN: cd cdn && ./monitor.sh"
    log "4. Update DNS to point to CDN domain"
    log ""
    log "🌐 CDN will be available at: http://$CDN_DOMAIN"
    log "🔧 Admin interface: http://$CDN_DOMAIN:8080"
}

# Run main function
main "$@"
