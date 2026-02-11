# Test runner Dockerfile for HAR Manager
# Used for running tests in isolated environment (CI/CD and optional local pre-push)
# Uses official Playwright image with pre-installed browsers

FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
# Note: test-runner.sh temporarily swaps .dockerignore to include tests
COPY . .

# Expose dev server port
EXPOSE 5173

# Default command runs all tests
CMD ["sh", "-c", "npm test -- --run && npm run test:e2e"]
