# Multi-stage build for the Angular frontend
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build for production
COPY . .
RUN npm run build -- --configuration=production

# Serve with nginx
FROM nginx:alpine

# Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Built frontend assets
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
