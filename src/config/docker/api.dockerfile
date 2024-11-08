FROM node:18-alpine

# Install Nginx
RUN apk add --no-cache nginx

# Install dependencies for better performance
RUN apk add --no-cache redis postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Nginx configuration
COPY nginx/api.conf /etc/nginx/conf.d/default.conf

# Start script
COPY scripts/start-api.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000

CMD ["/start.sh"] 