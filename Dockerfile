# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove node_modules to reduce image size
RUN rm -rf node_modules

# Production stage
FROM nginx:alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext curl

# Copy built application
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create environment configuration template
RUN echo 'window.ENV = {' > /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_OPENAI_API_KEY: "${REACT_APP_OPENAI_API_KEY}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_OPENAI_BASE_URL: "${REACT_APP_OPENAI_BASE_URL}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_COBALT_API_URL: "${REACT_APP_COBALT_API_URL}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_APP_NAME: "${REACT_APP_APP_NAME}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_APP_VERSION: "${REACT_APP_APP_VERSION}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_MAX_FILE_SIZE: "${REACT_APP_MAX_FILE_SIZE}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_SUPPORTED_FORMATS: "${REACT_APP_SUPPORTED_FORMATS}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_JWT_SECRET: "${REACT_APP_JWT_SECRET}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_SESSION_TIMEOUT: "${REACT_APP_SESSION_TIMEOUT}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_ENVIRONMENT: "${REACT_APP_ENVIRONMENT}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_API_TIMEOUT: "${REACT_APP_API_TIMEOUT}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_DEBUG: "${REACT_APP_DEBUG}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_MAX_UPLOAD_SIZE: "${REACT_APP_MAX_UPLOAD_SIZE}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_CHUNK_SIZE: "${REACT_APP_CHUNK_SIZE}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_CACHE_DURATION: "${REACT_APP_CACHE_DURATION}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_ENABLE_CACHE: "${REACT_APP_ENABLE_CACHE}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_DEFAULT_THEME: "${REACT_APP_DEFAULT_THEME}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_ENABLE_DARK_MODE: "${REACT_APP_ENABLE_DARK_MODE}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_DEFAULT_LANGUAGE: "${REACT_APP_DEFAULT_LANGUAGE}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_LOG_LEVEL: "${REACT_APP_LOG_LEVEL}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_ENABLE_CONSOLE_LOGS: "${REACT_APP_ENABLE_CONSOLE_LOGS}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_ENABLE_ANALYTICS: "${REACT_APP_ENABLE_ANALYTICS}",' >> /usr/share/nginx/html/env-config.js.template && \
    echo '  REACT_APP_ANALYTICS_ID: "${REACT_APP_ANALYTICS_ID}"' >> /usr/share/nginx/html/env-config.js.template && \
    echo '};' >> /usr/share/nginx/html/env-config.js.template

# Create startup script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Generate environment configuration' >> /docker-entrypoint.sh && \
    echo 'envsubst < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Start nginx' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Set default environment variables
ENV REACT_APP_OPENAI_API_KEY="" \
    REACT_APP_OPENAI_BASE_URL="https://api.openai.com/v1" \
    REACT_APP_COBALT_API_URL="https://apiclip.megafone.digital" \
    REACT_APP_APP_NAME="Transkipta" \
    REACT_APP_APP_VERSION="2.0.0" \
    REACT_APP_MAX_FILE_SIZE="100" \
    REACT_APP_SUPPORTED_FORMATS="mp4,mp3,wav,m4a,webm" \
    REACT_APP_JWT_SECRET="" \
    REACT_APP_SESSION_TIMEOUT="3600" \
    REACT_APP_ENVIRONMENT="production" \
    REACT_APP_API_TIMEOUT="30000" \
    REACT_APP_DEBUG="false" \
    REACT_APP_MAX_UPLOAD_SIZE="104857600" \
    REACT_APP_CHUNK_SIZE="1048576" \
    REACT_APP_CACHE_DURATION="86400" \
    REACT_APP_ENABLE_CACHE="true" \
    REACT_APP_DEFAULT_THEME="light" \
    REACT_APP_ENABLE_DARK_MODE="true" \
    REACT_APP_DEFAULT_LANGUAGE="pt-BR" \
    REACT_APP_LOG_LEVEL="info" \
    REACT_APP_ENABLE_CONSOLE_LOGS="false" \
    REACT_APP_ENABLE_ANALYTICS="false" \
    REACT_APP_ANALYTICS_ID="" \
    PORT="80"

# Add healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Change ownership of nginx directories to non-root user
RUN chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid && \
    chown -R nextjs:nodejs /usr/share/nginx/html

# Switch to non-root user
USER nextjs

EXPOSE 80

CMD ["/docker-entrypoint.sh"]