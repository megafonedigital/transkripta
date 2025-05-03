# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache gettext

# Copy the build files
COPY --from=build /app/build /usr/share/nginx/html

# Copy the nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Create a script to substitute environment variables
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'envsubst "\$BACKEND_URL" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"] 