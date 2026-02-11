# Git Hooks Configuration

HAR Manager использует [husky](https://typicode.github.io/husky/) для управления Git хуками.

## Pre-Push Hook

### Что делает

Перед каждым push в ветку `main` автоматически запускаются все тесты:

1. **Vitest** (unit + component + store) - 182 теста
2. **Playwright** (E2E) - 22 теста

Если хотя бы один тест падает - push блокируется.

### Как это выглядит

```bash
$ git push origin main

╔════════════════════════════════════════════════╗
║  Pre-push tests for main branch                ║
╠════════════════════════════════════════════════╣
Running all tests before push to main...

[1/2] Running Vitest (unit + component + store)...
✓ Vitest tests passed (182/182)

[2/2] Running Playwright E2E tests...
✓ Playwright E2E tests passed (22/22)

╔════════════════════════════════════════════════╗
║  ✅ All tests PASSED (204/204)                  ║
╠════════════════════════════════════════════════╣
║  Push to main allowed ✓                        ║
╚════════════════════════════════════════════════╝
```

### Если тесты падают

```bash
╔════════════════════════════════════════════════╗
║  ❌ Vitest tests FAILED                         ║
╠════════════════════════════════════════════════╣
║  Push to main BLOCKED                          ║
║  Fix failing tests before pushing              ║
╚════════════════════════════════════════════════╝

error: failed to push some refs to 'origin'
```

### Обход хука (для экстренных случаев)

```bash
# НЕ РЕКОМЕНДУЕТСЯ: обход pre-push хука
git push origin main --no-verify
```

⚠️ **Внимание**: Используйте `--no-verify` только в исключительных случаях. Это отключает защиту от поломанного кода в main.

## Установка хуков

При клонировании репозитория хуки устанавливаются автоматически через `npm install` (скрипт `prepare`).

Если хуки не работают:

```bash
npm run prepare
```

## Другие ветки

Pre-push хук запускается **только для ветки main**. Для feature-веток и develop хук не блокирует push, но рекомендуется всё равно запускать тесты локально:

```bash
npm test              # Vitest
npm run test:e2e      # Playwright
```

## Отключение хуков

Если вам нужно временно отключить хуки:

```bash
# Удалить .husky/pre-push
rm .husky/pre-push

# Или переименовать
mv .husky/pre-push .husky/pre-push.disabled
```

Для восстановления:

```bash
# Восстановить из git
git restore .husky/pre-push

# Сделать исполняемым
chmod +x .husky/pre-push
```

## CI/CD

GitHub Actions также запускает все тесты при push в main/develop, так что даже если хук обойдён локально - тесты всё равно прогонятся на сервере.

См. `.github/workflows/test.yml` для деталей.
