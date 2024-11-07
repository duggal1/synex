# Use Bun as base image
FROM oven/bun:1 as base
WORKDIR /app

# Install system dependencies and create nginx user
RUN apt-get update && apt-get install -y \
    nginx \
    certbot \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system nginx \
    && adduser --system --disabled-login --ingroup nginx --no-create-home --home /nonexistent --gecos "nginx user" --shell /bin/false nginx

# Copy package files
COPY package.json ./
COPY bun.lockb ./
COPY prisma ./prisma/

# Install dependencies with Bun
RUN bun install

# Generate Prisma client
RUN bunx prisma generate

# Copy the rest of the application
COPY . .

# Copy Nginx configurations
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/
COPY nginx/nginx.conf /etc/nginx/

# Create required directories and set permissions
RUN mkdir -p /run/nginx \
    && mkdir -p /var/log/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /run/nginx

EXPOSE 80 3000

# Start script
COPY scripts/start-dev.sh /start-dev.sh
RUN chmod +x /start-dev.sh

CMD ["/start-dev.sh"]