# Use Node.js 18 LTS as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create healthcheck script
COPY --chown=nodejs:nodejs healthcheck.js ./

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start production server
CMD ["npm", "start"]

# Test stage
FROM base AS test

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Run tests
RUN npm test

# Build stage for CI/CD
FROM base AS build

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Run tests and build
RUN npm test && npm run build 2>/dev/null || echo "No build script found"
