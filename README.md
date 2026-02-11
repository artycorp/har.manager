# HAR.MANAGER

![Test Suite](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, privacy-focused HTTP Archive (HAR) analyzer. It processes data entirely in your browser—no data is ever sent to a server.

**[Live Demo](https://artycorp.github.io/har.manager/)**

## Features

-   **Local-First Analysis**: All processing happens client-side using the FileReader API. Your sensitive request data stays on your machine.
-   **Comprehensive Waterfall Diagram**: Detailed breakdown of request timings, including DNS lookup, TCP connect, SSL handshake, request send, server wait (TTFB), and response receive.
-   **HAR Comparison Mode**: Upload two HAR files to perform a side-by-side analysis. Easily identify performance regressions, status code changes, or differences in response sizes.
-   **Observability Bridge**: Automatically generates deep links to external monitoring tools based on request headers:
    *   **Grafana Loki**: Search by `X-Request-ID`.
    *   **Sentry**: Navigate to traces via `sentry-trace` headers.
    *   **Custom Path Analysis**: Aggregate metrics for specific endpoints.
    *   **Coroot**: Integration for infrastructure context.
-   **Advanced Filtering**: Filter requests by HTTP methods, status code groups (2xx, 3xx, 4xx, 5xx), path substrings, or specific observability markers.
-   **Request Details**:
    *   **Headers**: Full list of request and response headers with search functionality.
    *   **Payloads**: Formatted and syntax-highlighted JSON or form-data previews.
    *   **Response**: Content previews for text, JSON, and images.
    *   **Copy as cURL**: Generate a ready-to-use cURL command for any request.
-   **Modern Interface**: Clean, "cyberpunk-inspired" dark theme with a focus on readability and responsive design.
-   **Multi-language Support**: Fully localized in English and Russian.

## Quick Start (Docker)

If you have Docker and Docker Compose installed:

```bash
cd har.manager
docker-compose up -d
```

Access the application at [http://localhost:8085](http://localhost:8085).

## Sample HAR Files

This repository includes pre-generated HAR files for testing application features:

-   **`test-filters.har`**: Best for testing the timeline, filters (method, status, path), and observability deep links (Loki, Sentry). It includes 5 parallel requests to demonstrate concurrency in the waterfall diagram.
-   **`test-comparison.har`**: Designed to be compared against `test-filters.har`. It contains performance changes, status updates, and unique requests to test the side-by-side comparison logic.

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

The development server will start at `http://localhost:5173`.

## Testing

The project includes a comprehensive test suite with **182 unit/component/store tests** and **22 E2E tests**.

### Run all tests

```bash
# Unit, component, and store tests (Vitest)
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage

# E2E tests (Playwright)
npm run test:e2e

# E2E tests in UI mode
npx playwright test --ui
```

### Test Structure

- **Unit Tests** (42 tests): Core utilities (`harParser.js`, `curlGenerator.js`, `formatters.js`)
- **Store Tests** (85 tests): Pinia store getters, actions, URL generators, config persistence
- **Component Tests** (55 tests): Vue component logic (filters, waterfall, comparison)
- **E2E Tests** (22 tests): Full user flows with Playwright

### CI/CD

Tests run automatically on GitHub Actions for every push and pull request. See [test workflow](.github/workflows/test.yml) for details.

## How to Use

1.  Open your browser's **DevTools** (F12 or Ctrl+Shift+I).
2.  Go to the **Network** tab.
3.  Perform the actions you want to record.
4.  Right-click anywhere in the request list and select **"Save all as HAR with content"**.
5.  Drag and drop the `.har` file into **HAR.MANAGER**.
6.  (Optional) For comparison, switch to the **Compare** tab and upload a second file.

## Configuration

You can configure your own observability tool URL templates in the **Settings** section. Use placeholders like `{request_id}`, `{trace_id}`, `{from}`, and `{to}` to build dynamic links.