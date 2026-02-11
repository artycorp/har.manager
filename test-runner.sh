#!/bin/bash

# Test runner wrapper script
# Runs tests either natively or in Docker container
# Usage:
#   ./test-runner.sh              # Native execution (fast)
#   USE_DOCKER=1 ./test-runner.sh # Docker execution (isolated)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
USE_DOCKER=${USE_DOCKER:-0}
DOCKER_IMAGE_NAME="har-manager-test-runner"
DOCKER_TAG="latest"

echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  HAR Manager Test Runner                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}\n"

if [ "$USE_DOCKER" = "1" ]; then
  echo -e "${YELLOW}Running tests in Docker container...${NC}\n"

  # Check if Docker is available
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Falling back to native execution...${NC}\n"
    USE_DOCKER=0
  fi
fi

if [ "$USE_DOCKER" = "1" ]; then
  # Docker execution
  echo -e "${CYAN}[1/3] Building test Docker image...${NC}"

  # Temporarily use .dockerignore.test if it exists
  if [ -f ".dockerignore.test" ]; then
    mv .dockerignore .dockerignore.bak 2>/dev/null || true
    cp .dockerignore.test .dockerignore
  fi

  docker build -f test.Dockerfile -t ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} . 2>&1 | tail -5
  build_exit=$?

  # Restore original .dockerignore
  if [ -f ".dockerignore.bak" ]; then
    mv .dockerignore.bak .dockerignore
  fi

  if [ $build_exit -ne 0 ]; then
    echo -e "\n${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Docker build FAILED                         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}\n"
    exit 1
  fi

  if [ $? -ne 0 ]; then
    echo -e "\n${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Docker build FAILED                         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}\n"
    exit 1
  fi

  echo -e "${GREEN}✓ Docker image built${NC}\n"

  echo -e "${CYAN}[2/3] Running Vitest in Docker...${NC}"
  docker run --rm ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} npm test -- --run
  vitest_exit=$?

  if [ $vitest_exit -ne 0 ]; then
    echo -e "\n${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Vitest tests FAILED                         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}\n"
    exit 1
  fi

  echo -e "\n${GREEN}✓ Vitest tests passed${NC}\n"

  echo -e "${CYAN}[3/3] Running Playwright E2E in Docker...${NC}"
  docker run --rm ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} npm run test:e2e
  playwright_exit=$?

  if [ $playwright_exit -ne 0 ]; then
    echo -e "\n${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Playwright E2E tests FAILED                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}\n"
    exit 1
  fi

  echo -e "\n${GREEN}✓ Playwright E2E tests passed${NC}\n"

else
  # Native execution
  echo -e "${YELLOW}Running tests natively...${NC}\n"

  echo -e "${CYAN}[1/2] Running Vitest...${NC}"
  npm test -- --run
  vitest_exit=$?

  if [ $vitest_exit -ne 0 ]; then
    echo -e "\n${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Vitest tests FAILED                         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}\n"
    exit 1
  fi

  echo -e "\n${GREEN}✓ Vitest tests passed${NC}\n"

  echo -e "${CYAN}[2/2] Running Playwright E2E...${NC}"
  echo -e "${YELLOW}Note: Starting dev server may take a moment...${NC}"
  npm run test:e2e
  playwright_exit=$?

  if [ $playwright_exit -ne 0 ]; then
    echo -e "\n${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Playwright E2E tests FAILED                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}\n"
    exit 1
  fi

  echo -e "\n${GREEN}✓ Playwright E2E tests passed${NC}\n"
fi

# All tests passed
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ All tests PASSED                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}\n"

exit 0
