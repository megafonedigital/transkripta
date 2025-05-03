FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    git \
    yt-dlp

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Create temp directory
RUN mkdir -p /app/src/temp

# Set permissions
RUN chmod -R 777 /app/src/temp

EXPOSE 3000

CMD ["npm", "start"] 