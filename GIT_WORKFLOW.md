# Git Workflow для HAR Manager

## Быстрая шпаргалка

### Обычная работа с feature-ветками

```bash
# Создать feature-ветку
git checkout -b feature/my-feature

# Работать, коммитить
git add .
git commit -m "feat: add new feature"

# Push в feature-ветку (хук НЕ запускается)
git push origin feature/my-feature
```

### Push в main (с автотестами)

```bash
# Переключиться на main
git checkout main

# Слить изменения
git merge feature/my-feature

# Push в main (хук ЗАПУСКАЕТСЯ автоматически!)
git push origin main
```

**Что происходит при push в main:**

```
╔════════════════════════════════════════════════╗
║  Pre-push tests for main branch                ║
╠════════════════════════════════════════════════╣
Running all tests before push to main...

[1/2] Running Vitest (unit + component + store)...
 ✓ src/utils/__tests__/harParser.spec.js (24)
 ✓ src/utils/__tests__/curlGenerator.spec.js (10)
 ✓ src/utils/__tests__/formatters.spec.js (8)
 ✓ src/stores/__tests__/harStore.spec.js (85)
 ✓ src/components/__tests__/RequestsTable.spec.js (35)
 ✓ src/components/__tests__/WaterfallBar.spec.js (11)
 ✓ src/components/__tests__/ComparisonTable.spec.js (9)

✓ Vitest tests passed (182/182)

[2/2] Running Playwright E2E tests...
 ✓ HAR Upload (4 tests)
 ✓ Filters (5 tests)
 ✓ Request Details Drawer (4 tests)
 ✓ Comparison Mode (4 tests)
 ✓ Settings Page (5 tests)

✓ Playwright E2E tests passed (22/22)

╔════════════════════════════════════════════════╗
║  ✅ All tests PASSED (204/204)                  ║
╠════════════════════════════════════════════════╣
║  Push to main allowed ✓                        ║
╚════════════════════════════════════════════════╝

Counting objects: 25, done.
Delta compression using up to 8 threads.
To github.com:user/har.manager.git
   f4e9718..3f4d806  main -> main
```

## Если тесты упали

**Сценарий:** Ты пытаешься запушить в main, но тесты падают.

```bash
$ git push origin main

╔════════════════════════════════════════════════╗
║  ❌ Vitest tests FAILED                         ║
╠════════════════════════════════════════════════╣
║  Push to main BLOCKED                          ║
║  Fix failing tests before pushing              ║
╚════════════════════════════════════════════════╝

error: failed to push some refs to 'origin'
```

**Что делать:**

```bash
# 1. Запустить тесты локально чтобы увидеть что упало
npm test

# 2. Исправить проблему

# 3. Закоммитить фикс
git add .
git commit -m "fix: resolve test failures"

# 4. Попробовать push снова
git push origin main
```

## Запуск тестов вручную (до push)

Рекомендуется запускать тесты вручную ПЕРЕД коммитом:

```bash
# Все unit/component/store тесты
npm test

# E2E тесты
npm run test:e2e

# С coverage
npm test -- --coverage

# Только изменённые тесты (watch mode)
npm test -- --watch
```

## Emergency bypass (использовать ТОЛЬКО в крайнем случае!)

```bash
# Обход pre-push хука
git push origin main --no-verify
```

⚠️ **ВНИМАНИЕ:** 
- Используй `--no-verify` только для экстренных hotfix'ов
- Поломанный код попадёт в main
- CI на GitHub всё равно запустит тесты
- Если CI-тесты упадут - main будет broken

## Commit message style

Используем [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new feature
fix: resolve bug in parser
test: add tests for harStore
chore: update dependencies
docs: improve README
refactor: extract formatters module
perf: optimize waterfall rendering
style: fix linting issues
```

## Полезные команды

```bash
# Статус репозитория
git status

# История коммитов (красиво)
git log --oneline --graph --all

# Посмотреть изменения перед коммитом
git diff

# Посмотреть staged изменения
git diff --cached

# Отменить последний коммит (сохранив изменения)
git reset --soft HEAD~1

# Посмотреть что изменилось в последнем коммите
git show HEAD
```

## Troubleshooting

### Хук не запускается

```bash
# Переустановить husky
rm -rf .husky
npm run prepare

# Проверить что файл исполняемый
ls -la .husky/pre-push
# Должно быть: -rwxr-xr-x

# Если нет - сделать исполняемым
chmod +x .husky/pre-push
```

### Тесты проходят локально, но падают в хуке

```bash
# Убедись что dev-сервер не запущен для E2E
# (хук запускает свой собственный)
pkill -f vite

# Запустить тесты так же как хук
npm test -- --run --reporter=basic
npm run test:e2e -- --reporter=list
```

### Долго ждать тестов при каждом push

**Рекомендация:** Работай в feature-ветках, там хук не запускается!

```bash
# Вместо прямого push в main:
git checkout -b feature/quick-fix
git add .
git commit -m "fix: quick fix"
git push origin feature/quick-fix  # ← Хук НЕ запускается!

# Потом через PR слить в main (тесты прогонятся на CI)
```

## См. также

- [HOOKS.md](HOOKS.md) - Детали про Git hooks
- [TEST_REPORT.md](TEST_REPORT.md) - Отчёт по тестам
- [CI_SETUP.md](CI_SETUP.md) - Настройка GitHub Actions
- [README.md](README.md) - Общая документация
