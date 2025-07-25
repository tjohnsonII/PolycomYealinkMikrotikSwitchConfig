# Production Dockerfile for Phone Config Generator
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    openssh-client \
    openvpn \
    iptables \
    net-tools \
    bind-tools \
    tcpdump \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S phoneconfig && \
    adduser -S phoneconfig -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=phoneconfig:phoneconfig /app/dist ./dist
COPY --from=builder --chown=phoneconfig:phoneconfig /app/node_modules ./node_modules
COPY --from=builder --chown=phoneconfig:phoneconfig /app/package*.json ./
COPY --from=builder --chown=phoneconfig:phoneconfig /app/backend ./backend
COPY --from=builder --chown=phoneconfig:phoneconfig /app/src ./src

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/ssl /app/uploads /app/backups /app/vpn-configs && \
    chown -R phoneconfig:phoneconfig /app

# Copy startup script
COPY --chown=phoneconfig:phoneconfig docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Expose ports
EXPOSE 3000 3001 3099 3443 443 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Switch to app user
USER phoneconfig

# Set environment
ENV NODE_ENV=production
ENV PORT=3443

# Start application
CMD ["./docker-entrypoint.sh"]
