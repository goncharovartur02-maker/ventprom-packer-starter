FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/core/package*.json ./packages/core/
COPY packages/parsers/package*.json ./packages/parsers/

# Install dependencies without problematic packages
RUN npm install --ignore-scripts --legacy-peer-deps

# Copy source code
COPY . .

# Build packages in correct order
RUN npm run build:core
# Skip parsers build for now - will be built at runtime
RUN npm run build:api

EXPOSE 3001

CMD ["npm", "run", "start:prod"]



