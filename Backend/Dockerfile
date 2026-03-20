# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create .env file for production
RUN echo "NODE_ENV=production" > .env
RUN echo "PORT=10000" >> .env

# Expose port
EXPOSE 10000

# Start the application
CMD ["npm", "start"]
