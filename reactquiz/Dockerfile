
# Use official Node.js LTS image
FROM node:22.18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Install a lightweight HTTP server for serving static files
RUN npm install -g serve

# Expose port 3000 (serve's default port)
EXPOSE 3000

# Start the production server serving the built files
CMD ["serve", "-s", "dist", "-l", "3000"]
