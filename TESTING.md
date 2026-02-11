# Testing Infrastructure

HAR Manager uses a hybrid testing approach that supports both **native** (fast) and **Docker** (isolated) test execution.

## Quick Start

### Native Testing (Fast)
```bash
# Run all tests locally
./test-runner.sh

# Or run tests separately
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
```

### Docker Testing (Isolated)
```bash
# Run all tests in Docker container
USE_DOCKER=1 ./test-runner.sh

# Or manually
docker build -f test.Dockerfile -t har-test .
docker run --rm har-test
```

## Pre-Push Hook

The pre-push hook automatically runs tests before pushing to `main`:

### Default Behavior (Native)
```bash
git push  # Fast, uses local Node.js and Playwright
```

### Docker Mode
```bash
USE_DOCKER=1 git push  # Slower, but isolated environment
```

### Skip Tests (Use with Caution)
```bash
git push --no-verify  # Bypasses all tests
```

## Test Structure

```
har.manager/
├── src/
│   ├── **/__tests__/          # Vitest unit/component tests
│   │   ├── *.spec.js          # Test files
│   └── ...
├── e2e/                        # Playwright E2E tests
│   ├── *.spec.js              # E2E test files
├── test.Dockerfile            # Docker image for tests
├── test-runner.sh             # Unified test runner
├── vitest.config.js           # Vitest configuration
└── playwright.config.js       # Playwright configuration
```

## Test Types

### 1. Vitest Unit Tests
- **Location**: `src/**/__tests__/*.spec.js`
- **Coverage**: Utilities, stores, components
- **Run**: `npm test`
- **Watch**: `npm test -- --watch`

### 2. Playwright E2E Tests
- **Location**: `e2e/*.spec.js`
- **Coverage**: Full user workflows
- **Run**: `npm run test:e2e`
- **UI Mode**: `npx playwright test --ui`

## CI/CD Integration

GitHub Actions runs tests on every push and PR:

### Workflows
- **test-native**: Fast native execution
- **test-docker**: Isolated Docker execution
- **lint**: Code quality checks
- **build**: Production build verification

See `.github/workflows/test.yml` for details.

## Docker Test Image

### Features
- Based on `node:20-alpine`
- Includes Chromium for Playwright
- Isolated environment (no port conflicts)
- Consistent across machines

### Build
```bash
docker build -f test.Dockerfile -t har-manager-test-runner .
```

### Run
```bash
# All tests
docker run --rm har-manager-test-runner

# Vitest only
docker run --rm har-manager-test-runner npm test -- --run

# Playwright only
docker run --rm har-manager-test-runner npm run test:e2e
```

## Troubleshooting

### E2E Tests Fail with "Connection Refused"
- **Cause**: Dev server not started
- **Solution**: Playwright config auto-starts server, but may timeout
- **Fix**: Try `USE_DOCKER=1` or increase timeout in `playwright.config.js`

### Docker Build Fails
- **Cause**: Docker not installed or not running
- **Solution**: Install Docker Desktop or use native mode
- **Fallback**: `USE_DOCKER=0 ./test-runner.sh`

### Tests Pass Locally but Fail in CI
- **Cause**: Environment differences
- **Solution**: Run `USE_DOCKER=1 ./test-runner.sh` locally to match CI
- **Debug**: Check GitHub Actions logs for details

### Port 5173 Already in Use
- **Cause**: Dev server already running
- **Solution**: `killall node` or `lsof -ti:5173 | xargs kill`
- **Or**: Use Docker mode which isolates ports

## Best Practices

1. **Run tests before pushing**: Pre-push hook enforces this for `main`
2. **Use native mode for speed**: Docker mode for isolation when needed
3. **Write E2E tests sparingly**: They're slower than unit tests
4. **Keep tests independent**: Each test should set up and tear down its own state
5. **Use descriptive test names**: `test('clicking a table row opens the drawer')`

## Performance Comparison

| Mode | Duration | Use Case |
|------|----------|----------|
| Native | ~10s | Development, quick feedback |
| Docker | ~60s | CI/CD, reproducibility, troubleshooting |
| Skip (--no-verify) | 0s | Emergency hotfixes (not recommended) |

## Configuration Files

- **`vitest.config.js`**: Vitest configuration (coverage, environment)
- **`playwright.config.js`**: Playwright configuration (browsers, server, timeout)
- **`test.Dockerfile`**: Docker image definition for test runner
- **`test-runner.sh`**: Unified test execution script
- **`.git/hooks/pre-push`**: Git hook that runs before push to main

## Future Improvements

- [ ] Add visual regression tests with Playwright
- [ ] Improve E2E test stability (reduce flakiness)
- [ ] Add test coverage reporting
- [ ] Implement parallel E2E test execution
- [ ] Add mutation testing
