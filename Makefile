# BloodBank Project Makefile

.PHONY: help install dev test build deploy clean logs health

# Default target
help:
	@echo "BloodBank Project Management"
	@echo ""
	@echo "Available commands:"
	@echo "  install     Install all dependencies"
	@echo "  dev         Start development environment"
	@echo "  test        Run all tests"
	@echo "  test:backend Run backend tests only"
	@echo "  test:frontend Run frontend tests only"
	@echo "  test:e2e   Run E2E tests only"
	@echo "  build       Build Docker images"
	@echo "  deploy:dev  Deploy to development"
	@echo "  deploy:staging Deploy to staging"
	@echo "  deploy:prod Deploy to production"
	@echo "  logs        Show application logs"
	@echo "  health      Check application health"
	@echo "  clean       Clean up containers and images"
	@echo "  lint        Run linting"
	@echo "  coverage    Generate coverage reports"

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd Backend && npm install
	cd Frontend && npm install

# Development
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build

dev-detach:
	@echo "Starting development environment in background..."
	docker-compose -f docker-compose.dev.yml up --build -d

# Testing
test:
	@echo "Running all tests..."
	$(MAKE) test:backend
	$(MAKE) test:frontend
	$(MAKE) test:e2e

test:backend:
	@echo "Running backend tests..."
	cd Backend && npm test

test:frontend:
	@echo "Running frontend tests..."
	cd Frontend && npm test

test:e2e:
	@echo "Running E2E tests..."
	docker-compose -f docker-compose.yml up -d mongodb backend frontend
	sleep 60
	cd Frontend && npm run test:e2e:headless
	docker-compose -f docker-compose.yml down

test:coverage:
	@echo "Generating coverage reports..."
	cd Backend && npm run test:coverage
	cd Frontend && npm run test:coverage

# Building
build:
	@echo "Building Docker images..."
	docker build -t bloodbank/backend:latest ./Backend
	docker build -t bloodbank/frontend:latest ./Frontend

build:dev:
	@echo "Building development images..."
	docker-compose -f docker-compose.dev.yml build

build:prod:
	@echo "Building production images..."
	docker-compose -f docker-compose.prod.yml build

# Deployment
deploy:dev:
	@echo "Deploying to development..."
	docker-compose -f docker-compose.dev.yml up -d --force-recreate

deploy:staging:
	@echo "Deploying to staging..."
	docker-compose -f docker-compose.staging.yml pull
	docker-compose -f docker-compose.staging.yml up -d --force-recreate
	$(MAKE) health

deploy:prod:
	@echo "Deploying to production..."
	docker-compose -f docker-compose.prod.yml pull
	docker-compose -f docker-compose.prod.yml up -d --force-recreate
	$(MAKE) health

# Utilities
logs:
	@echo "Showing application logs..."
	docker-compose logs -f

logs:backend:
	@echo "Showing backend logs..."
	docker-compose logs -f backend

logs:frontend:
	@echo "Showing frontend logs..."
	docker-compose logs -f frontend

health:
	@echo "Checking application health..."
	@echo "Backend health:"
	curl -f http://localhost:3000/health || echo "❌ Backend unhealthy"
	@echo "Frontend health:"
	curl -f http://localhost:5173/ || echo "❌ Frontend unhealthy"

clean:
	@echo "Cleaning up..."
	docker-compose down --volumes --remove-orphans
	docker system prune -f
	docker volume prune -f

clean:all:
	@echo "Deep clean..."
	$(MAKE) clean
	docker image prune -af

# Linting
lint:
	@echo "Running linting..."
	$(MAKE) lint:backend
	$(MAKE) lint:frontend

lint:backend:
	@echo "Linting backend..."
	cd Backend && npm run lint || echo "No lint script found"

lint:frontend:
	@echo "Linting frontend..."
	cd Frontend && npm run lint

# Database
db:backup:
	@echo "Creating database backup..."
	./scripts/backup.sh $(ENVIRONMENT)

db:restore:
	@echo "Restoring database backup..."
	./scripts/restore.sh $(ENVIRONMENT) $(BACKUP_ID)

db:backup:production:
	@echo "Creating production backup..."
	./scripts/backup.sh production

db:backup:staging:
	@echo "Creating staging backup..."
	./scripts/backup.sh staging

db:restore:production:
	@echo "Restoring production backup..."
	./scripts/restore.sh production $(BACKUP_ID)

db:restore:staging:
	@echo "Restoring staging backup..."
	./scripts/restore.sh staging $(BACKUP_ID)

# Database optimization
db:optimize:
	@echo "Optimizing database..."
	node scripts/database-optimization.js

db:backup:strategy:
	@echo "Running backup strategy..."
	node scripts/database-backup-strategy.js full

db:backup:incremental:
	@echo "Running incremental backup..."
	node scripts/database-backup-strategy.js incremental

db:backup:collections:
	@echo "Backing up collections..."
	node scripts/database-backup-strategy.js collections
	@echo "Setting up automated backup cron job..."
	(crontab -l 2>/dev/null; echo "0 2 * * * /opt/bloodbank/scripts/backup-cron.sh") | crontab -
	@echo "✅ Cron job setup for daily backup at 2 AM"

db:list-backups:
	@echo "Listing available backups..."
	ls -la /opt/backups/bloodbank/$(ENVIRONMENT)/ 2>/dev/null || echo "No backups found"

db:seed:
	@echo "Seeding database..."
	docker exec sebn-mongodb mongo sebn_db /docker-entrypoint-initdb.d/init-mongo.js

# Security
security:scan:
	@echo "Running security scan..."
	docker run --rm -v $(PWD):/app aquasec/trivy:latest fs /app

security:audit:
	@echo "Running npm audit..."
	cd Backend && npm audit
	cd Frontend && npm audit

# Load testing
test:load:smoke:
	@echo "Running smoke test..."
	k6 run --vus 10 --duration 30s tests/load/smoke-test.js

test:load:api:
	@echo "Running API load test..."
	k6 run tests/load/api-load-test.js --out json=api-load-results.json

test:load:stress:
	@echo "Running stress test..."
	k6 run tests/load/stress-test.js --out json=stress-results.json

test:load:soak:
	@echo "Running soak test..."
	k6 run tests/load/soak-test.js --out json=soak-results.json

test:load:all:
	@echo "Running all load tests..."
	$(MAKE) test:load:smoke
	$(MAKE) test:load:api
	$(MAKE) test:load:stress
	@echo "Running performance tests..."
	curl -L https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz | tar xvz -C /tmp
	/tmp/k6-v0.47.0-linux-amd64/k6 run --vus 10 --duration 30s scripts/performance-test.js

# Monitoring
monitor:setup:
	@echo "Setting up monitoring..."
	docker-compose -f docker-compose.monitoring.yml up -d

monitor:dashboard:
	@echo "Opening monitoring dashboard..."
	@echo "Grafana: http://localhost:3000 (admin/admin)"
	@echo "Prometheus: http://localhost:9090"

# Quick start
quick-start:
	@echo "🚀 Quick starting BloodBank..."
	$(MAKE) install
	$(MAKE) build:dev
	$(MAKE) dev-detach
	@echo "✅ BloodBank is starting up..."
	@echo "📊 Check health with: make health"
	@echo "🌐 Frontend: http://localhost:5173"
	@echo "🔧 Backend API: http://localhost:3000"
	@echo "📝 Logs: make logs"

# Auto-scaling
autoscale:status:
	@echo "Checking auto-scaling status..."
	./scripts/autoscaling.sh status

autoscale:backend:
	@echo "Auto-scaling backend..."
	./scripts/autoscaling.sh auto-scale backend

autoscale:frontend:
	@echo "Auto-scaling frontend..."
	./scripts/autoscaling.sh auto-scale frontend

scale:backend:
	@echo "Scaling backend to $(SCALE) replicas..."
	./scripts/autoscaling.sh scale backend $(SCALE)

scale:frontend:
	@echo "Scaling frontend to $(SCALE) replicas..."
	./scripts/autoscaling.sh scale frontend $(SCALE)

health:autoscale:
	@echo "Checking auto-scaling health..."
	./scripts/autoscaling.sh health
prod:status:
	@echo "Checking production status..."
	docker-compose -f docker-compose.prod.yml ps

prod:rollback:
	@echo "Rolling back production..."
	@read -p "Enter commit hash to rollback to: " commit; \
	git checkout $$commit; \
	$(MAKE) deploy:prod

prod:scale:
	@echo "Scaling production services..."
	@read -p "Enter service name: " service; \
	read -p "Enter replica count: " replicas; \
	docker-compose -f docker-compose.prod.yml up -d --scale $$service=$$replicas
