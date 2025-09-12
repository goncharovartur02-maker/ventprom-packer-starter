FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/core/package*.json ./packages/core/
COPY packages/parsers/package*.json ./packages/parsers/

# Install all dependencies (including dev dependencies for building)
RUN npm install --ignore-scripts --legacy-peer-deps

# Copy source code
COPY . .

# Build packages in correct order
RUN npm run build:core
# Skip parsers build for now - will be built at runtime
RUN npm run build:web

EXPOSE 3000

CMD ["npm", "run", "start"]



