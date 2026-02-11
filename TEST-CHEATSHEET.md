# Test Runner Cheatsheet

## Quick Commands

```bash
# Native tests (fast, ~10s)
./test-runner.sh

# Docker tests (isolated, ~60s)
USE_DOCKER=1 ./test-runner.sh

# Git push with tests
git push                     # Native mode
USE_DOCKER=1 git push        # Docker mode
git push --no-verify         # Skip tests (emergency only)

# Individual test suites
npm test                     # Vitest unit tests
npm run test:e2e             # Playwright E2E tests

# Docker manual
docker build -f test.Dockerfile -t har-test .
docker run --rm har-test
```

## Files Created

- `test.Dockerfile` - Docker image for isolated testing
- `test-runner.sh` - Unified test runner (native/Docker)
- `.git/hooks/pre-push` - Updated with Docker support
- `.github/workflows/test.yml` - CI/CD workflow
- `TESTING.md` - Complete testing documentation
- `TEST-CHEATSHEET.md` - This file

## Troubleshooting

| Problem | Solution |
|---------|----------|
| E2E tests timeout | `USE_DOCKER=1` or increase `playwright.config.js` timeout |
| Port 5173 in use | `pkill -f vite` or use Docker mode |
| Docker build fails | Ensure Docker running, fallback to native |
| Tests flaky | Run `USE_DOCKER=1` for consistent environment |

## Pre-Push Hook Behavior

- **main branch**: Tests run automatically
- **other branches**: No tests (push freely)
- **Native mode**: Default (fast)
- **Docker mode**: Set `USE_DOCKER=1`
- **Skip**: Use `--no-verify` (not recommended)
