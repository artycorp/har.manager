# GitHub Actions CI Setup Guide

This document explains how the CI/CD pipeline is configured for HAR Manager test automation.

## Overview

The project uses **GitHub Actions** to automatically run tests on every push and pull request. The workflow is split into two jobs:

1. **Vitest Job**: Runs unit, component, and store tests
2. **Playwright Job**: Runs E2E tests in a headless browser

## Workflow File

Location: `.github/workflows/test.yml`

### Triggers

The workflow runs on:
- Push to `main`, `master`, or `develop` branches
- Pull requests targeting these branches
- Only when files in `har.manager/` directory are changed

### Jobs

#### 1. Vitest Job (Unit & Component Tests)

**Steps:**
1. Checkout code
2. Setup Node.js 20 with npm cache
3. Install dependencies (`npm ci`)
4. Run Vitest tests with verbose reporter
5. Generate coverage report
6. Upload coverage artifacts (retained for 7 days)

**Output:**
- Test results in console
- Coverage report in artifacts

#### 2. Playwright Job (E2E Tests)

**Steps:**
1. Checkout code
2. Setup Node.js 20 with npm cache
3. Install dependencies (`npm ci`)
4. Install Playwright Chromium browser with system dependencies
5. Run Playwright tests (with `CI=true` env var)
6. Upload Playwright HTML report (retained for 7 days)
7. Upload test results on failure (retained for 7 days)

**Output:**
- Test results in console
- HTML report with screenshots/videos in artifacts
- Test results directory with traces on failure

## Badge Setup

To display CI status in your README, replace the placeholder in the badge URL:

```markdown
![Test Suite](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml/badge.svg)
```

Replace:
- `YOUR_USERNAME` with your GitHub username/organization
- `YOUR_REPO` with your repository name

Example:
```markdown
![Test Suite](https://github.com/artycorp/har-manager/actions/workflows/test.yml/badge.svg)
```

## Local Testing

Before pushing, run tests locally:

```bash
# Unit/Component/Store tests
npm test

# E2E tests (requires dev server running)
npm run test:e2e

# Coverage report
npm test -- --coverage
```

## Environment Variables

The CI environment sets:
- `CI=true` for Playwright tests (enables CI-specific settings in `playwright.config.js`)
- Node.js cache based on `package-lock.json` checksum

## Artifacts

### Coverage Reports
- **Retention**: 7 days
- **Location**: `har.manager/coverage/`
- **Format**: HTML, JSON, and text reports

### Playwright Reports
- **Retention**: 7 days
- **Location**: `har.manager/playwright-report/`
- **Contents**: Interactive HTML report with test results

### Test Results (on failure)
- **Retention**: 7 days
- **Location**: `har.manager/test-results/`
- **Contents**: Screenshots, videos, and trace files for failed tests

## Troubleshooting

### Vitest Failures
1. Check the console output in the GitHub Actions log
2. Download the coverage artifact to see detailed coverage
3. Run `npm test -- --run` locally to reproduce

### Playwright Failures
1. Download the Playwright report artifact
2. Open `index.html` in your browser to see interactive results
3. If available, download test-results artifact for traces
4. View screenshots/videos to understand failures
5. Run `npx playwright test --debug` locally to debug

### Common Issues

**Issue**: `npm ci` fails
- **Solution**: Ensure `package-lock.json` is committed and up-to-date

**Issue**: Playwright browser not found
- **Solution**: Ensure `npx playwright install chromium --with-deps` is in the workflow

**Issue**: Tests timeout in CI but pass locally
- **Solution**: Increase timeout in playwright.config.js for CI environment

## Configuration Files

- `.github/workflows/test.yml` - GitHub Actions workflow
- `vite.config.js` - Vitest configuration with coverage
- `playwright.config.js` - Playwright E2E test configuration
- `package.json` - Test scripts and dependencies

## Required Dependencies

**Testing:**
- `vitest` - Test runner
- `@vitest/coverage-v8` - Coverage reporter
- `happy-dom` - DOM environment for Vitest
- `@vue/test-utils` - Vue component testing utilities
- `@pinia/testing` - Pinia store testing utilities
- `@playwright/test` - E2E testing framework

All dependencies are automatically installed by `npm ci` in the CI environment.

## Next Steps

1. Push your code to GitHub
2. Navigate to the **Actions** tab in your repository
3. Watch the workflow run automatically
4. Review test results and artifacts
5. Fix any failing tests
6. Update the README badge URL with your repository details

## Performance

Typical CI run times:
- **Vitest job**: ~30-45 seconds
- **Playwright job**: ~1-2 minutes
- **Total**: ~2-3 minutes

These jobs run in parallel, so total workflow time is determined by the slower job.
