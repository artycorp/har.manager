# Test runner Dockerfile for HAR Manager
# Used for running tests in isolated environment (CI/CD and optional local pre-push)

FROM node:20-alpine

# Install Playwright dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Playwright to use system chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set up Playwright
RUN npx playwright install-deps || true

# Expose dev server port
EXPOSE 5173

# Default command runs all tests
CMD ["sh", "-c", "npm test -- --run && npm run test:e2e"]
