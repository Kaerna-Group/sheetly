
# 1. Главная идея архитектуры

```text
React + TypeScript + Vite + Tailwind
        ↓
GitHub Pages
        ↓
Google OAuth в браузере
        ↓
Google Sheets API
        ↓
Google-таблица пользователя
```

Пользователь сам вставляет ссылку на свою Google-таблицу, приложение вытаскивает `spreadsheetId`, сохраняет настройки локально и потом пишет данные именно в эту таблицу. Access token не надо хранить навсегда: Google прямо указывает, что токен в browser token model короткоживущий, и при истечении его получают заново через `requestAccessToken()` по действию пользователя. ([Google for Developers][1])

---

# 2. Что будет у приложения

Я бы делал не просто “форма → записать строку”, а нормальный маленький продукт:

```text
1. Подключение Google-таблицы
2. Проверка структуры таблицы
3. Автоматическое создание нужных листов
4. Добавление доходов / расходов / выплат
5. Категории
6. Фильтры
7. История операций
8. Статистика на сайте
9. Статистика формулами в Google Sheets
10. Офлайн-очередь, если нет интернета
11. Экспорт / импорт настроек
12. Красивый PWA-интерфейс
```

GitHub Pages с Vite нормально деплоится через GitHub Actions; для репозитория вида `username.github.io/repo` нужно правильно выставить `base: "/repo/"` в `vite.config.ts`. ([vitejs][2])

---

# 3. Стек проекта

## Основной стек

```text
React
TypeScript
Vite
Tailwind CSS
React Router
Zod
Recharts
Google Identity Services
Google Sheets API
IndexedDB
localStorage
```

Почему так:

`Vite + React + TypeScript` — основа проекта.

`Tailwind CSS` — основной способ стилизации. Обычный CSS оставляем только для редких вещей: keyframes, сложные scrollbar-стили, мелкие анимации, CSS variables.

`Zod` — для валидации форм и данных перед записью в таблицу; он TypeScript-first и позволяет описывать схемы валидации, которые дают типизированный результат. ([Zod][3])

`Recharts` — для графиков на сайте. Он построен вокруг переиспользуемых React-компонентов для графиков. ([recharts.org][4])

`IndexedDB` — для локального кэша операций и офлайн-очереди. MDN описывает IndexedDB как клиентское хранилище для большого количества структурированных данных. ([MDN Web Docs][5])

`localStorage` — только для маленьких настроек: `spreadsheetId`, название листов, тема, валюта, выбранный язык.

---

# 4. FSD структура проекта

Feature-Sliced Design делит проект на слои `app`, `pages`, `widgets`, `features`, `entities`, `shared`; официальная документация FSD описывает эти слои как организацию по уровню ответственности и зависимостей. ([feature-sliced.design][6])

Я бы сделал так:

```text
src/
  app/
    providers/
      AppProviders.tsx
      RouterProvider.tsx
      QueryProvider.tsx
      ThemeProvider.tsx

    routes/
      routes.tsx
      route-paths.ts

    styles/
      index.css

    config/
      app-config.ts
      env-config.ts

    App.tsx
    main.tsx

  pages/
    dashboard/
      ui/
        DashboardPage.tsx
        DashboardPageHeader.tsx
        DashboardPageContent.tsx
      model/
        useDashboardPage.ts
      index.ts

    transactions/
      ui/
        TransactionsPage.tsx
        TransactionsPageHeader.tsx
        TransactionsPageContent.tsx
      model/
        useTransactionsPage.ts
      index.ts

    settings/
      ui/
        SettingsPage.tsx
        SettingsPageHeader.tsx
        SettingsPageContent.tsx
      model/
        useSettingsPage.ts
      index.ts

    setup/
      ui/
        SetupPage.tsx
        SetupSteps.tsx
      model/
        useSetupPage.ts
      index.ts

  widgets/
    app-layout/
      ui/
        AppLayout.tsx
        AppSidebar.tsx
        AppHeader.tsx
        AppMobileNav.tsx
      model/
        useAppLayout.ts
      index.ts

    dashboard-summary/
      ui/
        DashboardSummary.tsx
        SummaryCard.tsx
      model/
        useDashboardSummary.ts
      lib/
        build-summary-cards.ts
      index.ts

    analytics-charts/
      ui/
        AnalyticsCharts.tsx
        MonthlyBalanceChart.tsx
        CategoryPieChart.tsx
        IncomeExpenseChart.tsx
      model/
        useAnalyticsCharts.ts
      lib/
        map-transactions-to-chart-data.ts
      index.ts

    transactions-table/
      ui/
        TransactionsTable.tsx
        TransactionsTableRow.tsx
        TransactionsTableFilters.tsx
      model/
        useTransactionsTable.ts
      index.ts

  features/
    google-auth/
      ui/
        GoogleConnectButton.tsx
        GoogleConnectionStatus.tsx
      model/
        useGoogleAuth.ts
        google-auth.store.ts
      api/
        google-auth.client.ts
      types/
        google-token.type.ts
        google-auth-state.type.ts
      index.ts

    connect-spreadsheet/
      ui/
        SpreadsheetUrlForm.tsx
        SpreadsheetConnectionCard.tsx
      model/
        useConnectSpreadsheet.ts
      lib/
        extract-spreadsheet-id.ts
        validate-spreadsheet-url.ts
      types/
        spreadsheet-connection.type.ts
      index.ts

    setup-spreadsheet/
      ui/
        SetupSpreadsheetButton.tsx
        SpreadsheetSetupStatus.tsx
      model/
        useSetupSpreadsheet.ts
      lib/
        build-template-requests.ts
        build-default-formulas.ts
      types/
        spreadsheet-template-version.type.ts
      index.ts

    create-transaction/
      ui/
        TransactionForm.tsx
        TransactionAmountField.tsx
        TransactionCategorySelect.tsx
        TransactionTypeToggle.tsx
      model/
        useTransactionForm.ts
        transaction-form.schema.ts
      lib/
        map-form-to-transaction.ts
        generate-transaction-id.ts
      types/
        transaction-form-values.type.ts
      index.ts

    sync-transactions/
      ui/
        SyncStatusBadge.tsx
        RetrySyncButton.tsx
      model/
        useSyncTransactions.ts
      lib/
        sync-pending-transactions.ts
      types/
        sync-status.type.ts
        sync-result.type.ts
      index.ts

    filter-transactions/
      ui/
        TransactionFilters.tsx
        DateRangeFilter.tsx
        CategoryFilter.tsx
      model/
        useTransactionFilters.ts
      types/
        transaction-filter.type.ts
      index.ts

  entities/
    transaction/
      model/
        transaction.schema.ts
      types/
        transaction.type.ts
        transaction-id.type.ts
        transaction-kind.type.ts
        transaction-status.type.ts
        transaction-source.type.ts
      lib/
        calculate-signed-amount.ts
        is-expense.ts
        is-income.ts
        normalize-transaction.ts
      index.ts

    category/
      model/
        category.schema.ts
      types/
        category.type.ts
        category-id.type.ts
        category-kind.type.ts
      lib/
        get-default-categories.ts
      index.ts

    spreadsheet/
      types/
        spreadsheet-id.type.ts
        spreadsheet-range.type.ts
        spreadsheet-sheet-name.type.ts
        spreadsheet-metadata.type.ts
      lib/
        parse-spreadsheet-url.ts
        build-a1-range.ts
      index.ts

    analytics/
      types/
        monthly-stat.type.ts
        category-stat.type.ts
        balance-stat.type.ts
        analytics-period.type.ts
      lib/
        calculate-monthly-stats.ts
        calculate-category-stats.ts
        calculate-balance.ts
      index.ts

    app-settings/
      types/
        app-settings.type.ts
        currency-code.type.ts
        theme-mode.type.ts
      model/
        app-settings.schema.ts
      index.ts

  shared/
    api/
      google-sheets/
        google-sheets.client.ts
        google-sheets.endpoints.ts
        google-sheets.scopes.ts
        google-sheets.errors.ts
        types/
          append-values-request.type.ts
          batch-update-request.type.ts
          value-range.type.ts

    lib/
      storage/
        local-storage.service.ts
        indexed-db.service.ts
        storage-keys.ts

      date/
        format-date.ts
        get-month-key.ts
        parse-date.ts

      number/
        format-money.ts
        parse-money.ts

      errors/
        app-error.ts
        error-code.type.ts
        map-google-error.ts

      guards/
        is-defined.ts
        assert-never.ts

    ui/
      button/
        Button.tsx
        button-variants.ts
        index.ts

      input/
        Input.tsx
        index.ts

      select/
        Select.tsx
        index.ts

      card/
        Card.tsx
        index.ts

      modal/
        Modal.tsx
        index.ts

      toast/
        Toast.tsx
        index.ts

      empty-state/
        EmptyState.tsx
        index.ts

      loader/
        Loader.tsx
        index.ts

    config/
      constants/
        app.constants.ts
        sheet.constants.ts
        routes.constants.ts

      theme/
        theme.constants.ts
        colors.constants.ts
```

Главное правило: **страницы не содержат бизнес-логику**. Страница только собирает блоки как конструктор:

```tsx
export function DashboardPage() {
  return (
    <AppLayout>
      <DashboardPageHeader />
      <DashboardSummary />
      <AnalyticsCharts />
      <TransactionsTable />
    </AppLayout>
  );
}
```

---

# 5. Правила чистой структуры

## Типы

Каждый важный тип — в отдельном файле:

```text
transaction.type.ts
transaction-id.type.ts
transaction-kind.type.ts
transaction-status.type.ts
category.type.ts
spreadsheet-id.type.ts
monthly-stat.type.ts
```

Пример:

```ts
// entities/transaction/types/transaction-kind.type.ts
export type TransactionKind = "income" | "expense";
```

```ts
// entities/transaction/types/transaction.type.ts
import type { TransactionKind } from "./transaction-kind.type";

export type Transaction = {
  id: string;
  date: string;
  kind: TransactionKind;
  categoryId: string;
  amount: number;
  currency: string;
  comment?: string;
  createdAt: string;
  syncedAt?: string;
};
```

## Хуки

Большие хуки не держим внутри компонентов.

Плохо:

```text
TransactionForm.tsx на 400 строк
```

Хорошо:

```text
TransactionForm.tsx
useTransactionForm.ts
transaction-form.schema.ts
map-form-to-transaction.ts
```

## UI

Один `Button`, один `Input`, один `Card`, один `Modal`.
Не плодим `BlueButton`, `GreenButton`, `SubmitButton`. Для вариантов используем `variant`.

```tsx
<Button variant="primary" />
<Button variant="ghost" />
<Button variant="danger" />
```

---

# 6. Как будет работать подключение таблицы

## Первый запуск

```text
1. Пользователь открывает сайт
2. Вставляет ссылку на Google Sheet
3. Нажимает “Подключить Google”
4. Приложение получает access token
5. Проверяет таблицу
6. Если нужных листов нет — предлагает создать
7. Создаёт листы Ledger, Categories, Summary, MonthlyStats
8. Сохраняет spreadsheetId локально
```

Google Identity Services token model позволяет в браузере получить access token через `initTokenClient()` и `requestAccessToken()`, а потом использовать этот токен для REST/CORS-запросов к Google API. ([Google for Developers][1])

## Повторный запуск через месяц

```text
1. Пользователь открывает сайт
2. spreadsheetId уже сохранён
3. Если токена нет — кнопка “Подключить Google”
4. После подключения всё снова работает
```

Ничего заново деплоить не нужно.

---

# 7. Структура Google-таблицы

Я бы не делал “всё в один неструктурированный столбец”. Это потом убьёт аналитику. Лучше сделать **один главный лист Ledger**, где каждая строка — одна операция.

## Лист `Ledger`

```text
A: id
B: date
C: kind
D: category
E: amount
F: signedAmount
G: currency
H: paymentMethod
I: comment
J: createdAt
K: source
L: syncStatus
```

Пример:

```text
id | date | kind | category | amount | signedAmount | currency | method | comment | createdAt
1  | 2026-05-18 | expense | food | 250 | -250 | UAH | card | ATB | ...
2  | 2026-05-18 | income  | salary | 8000 | 8000 | UAH | card | salary | ...
```

`amount` всегда положительный.
`signedAmount` уже нужен для аналитики:

```text
income  → +amount
expense → -amount
```

Формула для `signedAmount` в Google Sheets:

```text
=IF(C2="expense",-E2,E2)
```

Если приложение будет записывать формулы или даты в таблицу через API, нужно использовать `valueInputOption: "USER_ENTERED"`, потому что Google Sheets тогда парсит значения так, как будто пользователь ввёл их в UI: числа остаются числами, строки могут быть преобразованы в даты/числа и т.д. ([Google for Developers][7])

---

# 8. Листы для аналитики в Google Sheets

## `Summary`

```text
Metric | Value
Total Income | =SUMIF(Ledger!C:C,"income",Ledger!E:E)
Total Expense | =SUMIF(Ledger!C:C,"expense",Ledger!E:E)
Balance | =B2-B3
Transaction Count | =COUNTA(Ledger!A:A)-1
Average Expense | =AVERAGEIF(Ledger!C:C,"expense",Ledger!E:E)
```

## `MonthlyStats`

```text
Month | Income | Expense | Balance
2026-05 | formula | formula | formula
2026-06 | formula | formula | formula
```

Можно сделать формулами через `SUMIFS`, группировку по месяцу или через `QUERY`.

## `CategoryStats`

```text
Category | Income | Expense | Total
food | 0 | 5200 | -5200
salary | 30000 | 0 | 30000
transport | 0 | 1200 | -1200
```

## `Categories`

```text
id | name | kind | color | icon | isDefault
food | Food | expense | #... | shopping-cart | TRUE
salary | Salary | income | #... | wallet | TRUE
```

---

# 9. Аналитика на сайте

Сайт не должен зависеть только от формул в Google Sheets. Он должен уметь:

```text
1. Прочитать Ledger
2. Превратить строки в Transaction[]
3. Посчитать статистику в JS/TS
4. Нарисовать графики
```

Графики:

```text
1. Доходы vs расходы по месяцам
2. Баланс по месяцам
3. Расходы по категориям
4. Последние операции
5. Средний расход за день
6. Топ категорий
7. Прогноз: сколько останется до конца месяца
```

В entities/analytics должны лежать чистые функции:

```text
calculateMonthlyStats.ts
calculateCategoryStats.ts
calculateBalance.ts
calculateAverageDailyExpense.ts
```

Эти функции не знают ничего про React и Google. Они просто принимают массив `Transaction[]`.

---

# 10. Google Sheets API слой

Всё, что касается Google Sheets, не должно быть размазано по проекту.

```text
shared/api/google-sheets/
  google-sheets.client.ts
  google-sheets.endpoints.ts
  google-sheets.scopes.ts
  google-sheets.errors.ts
```

Пример методов:

```ts
export type GoogleSheetsClient = {
  appendRow: (params: AppendRowParams) => Promise<void>;
  readRange: (params: ReadRangeParams) => Promise<string[][]>;
  updateRange: (params: UpdateRangeParams) => Promise<void>;
  batchUpdateValues: (params: BatchUpdateValuesParams) => Promise<void>;
};
```

`spreadsheets.values.append` дописывает значения в следующую строку найденной таблицы, а `spreadsheets.values.batchUpdate` позволяет обновлять сразу несколько диапазонов. ([Google for Developers][8])

---

# 11. Режим “подключается то, что есть”

Тут я бы сделал архитектуру через адаптеры.

```text
shared/lib/data-source/
  data-source.type.ts
  google-sheets-data-source.ts
  local-demo-data-source.ts
  offline-queue-data-source.ts
```

Идея:

```ts
export type FinanceDataSource = {
  getTransactions: () => Promise<Transaction[]>;
  createTransaction: (transaction: Transaction) => Promise<void>;
  getCategories: () => Promise<Category[]>;
};
```

Потом приложение выбирает источник:

```text
Если Google подключён → GoogleSheetsDataSource
Если Google не подключён → LocalDemoDataSource
Если offline → OfflineQueueDataSource + IndexedDB
```

Так проект не будет зависеть жёстко от Google Sheets. В будущем можно будет добавить Supabase, Firebase, SQLite, backend API — и не переписывать весь UI.

---

# 12. Офлайн-режим

Минимально:

```text
1. Пользователь добавляет операцию без интернета
2. Операция сохраняется в IndexedDB со статусом pending
3. В UI появляется “Ожидает синхронизации”
4. Когда интернет вернулся — приложение пробует отправить pending-операции в Google Sheets
5. После успеха статус меняется на synced
```

Для этого нужны:

```text
features/sync-transactions
shared/lib/storage/indexed-db.service.ts
entities/transaction transaction.syncStatus
```

Статусы:

```ts
export type TransactionSyncStatus =
  | "local"
  | "pending"
  | "syncing"
  | "synced"
  | "failed";
```

---

# 13. Tailwind и стили

CSS-файлы минимально:

```text
src/app/styles/index.css
```

Там только:

```css
@import "tailwindcss";

@theme {
  --color-brand: #6366f1;
  --color-success: #22c55e;
  --color-danger: #ef4444;
}
```

В компонентах используем Tailwind:

```tsx
<div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
```

Для вариантов компонентов лучше использовать `class-variance-authority` или свою простую функцию `cn`.

```text
shared/lib/classnames/cn.ts
shared/ui/button/button-variants.ts
```

---

# 14. Главные фичи по этапам

## Этап 1 — инициализация проекта

```text
Создать Vite React TS
Подключить Tailwind
Настроить aliases
Настроить ESLint
Настроить Prettier
Настроить Husky + lint-staged
Настроить GitHub Actions deploy
Настроить базовую FSD-структуру
```

Команды:

```bash
npm create vite@latest finance-sheets-tracker -- --template react-ts
cd finance-sheets-tracker
npm install
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom zod recharts
npm install -D eslint prettier husky lint-staged vitest
```

---

## Этап 2 — базовый UI-kit

```text
Button
Input
Select
Card
Modal
Toast
Loader
EmptyState
PageHeader
```

Правило: сначала shared/ui, потом страницы.

---

## Этап 3 — Google OAuth

```text
Создать Google Cloud Project
Включить Google Sheets API
Создать OAuth Client ID для Web
Добавить authorized JavaScript origins
Добавить GitHub Pages URL
Добавить localhost для разработки
Реализовать GoogleConnectButton
Реализовать useGoogleAuth
```

Scope:

```text
https://www.googleapis.com/auth/spreadsheets
```

Этот scope нужен, если приложение должно читать и писать таблицы пользователя.

---

## Этап 4 — подключение таблицы

```text
Пользователь вставляет ссылку
Приложение достаёт spreadsheetId
Проверяет доступ
Сохраняет spreadsheetId
Показывает статус подключения
```

Файлы:

```text
features/connect-spreadsheet/
  ui/SpreadsheetUrlForm.tsx
  model/useConnectSpreadsheet.ts
  lib/extract-spreadsheet-id.ts
  lib/validate-spreadsheet-url.ts
```

---

## Этап 5 — создание структуры таблицы

Фича:

```text
features/setup-spreadsheet
```

Она должна:

```text
1. Проверить наличие листов
2. Создать недостающие листы
3. Записать заголовки
4. Записать базовые категории
5. Записать формулы Summary
6. Записать templateVersion
```

Листы:

```text
Ledger
Categories
Summary
MonthlyStats
CategoryStats
Settings
```

---

## Этап 6 — добавление операций

Фича:

```text
features/create-transaction
```

Поля формы:

```text
Тип: income / expense
Дата
Сумма
Валюта
Категория
Способ оплаты
Комментарий
```

После submit:

```text
1. Zod validate
2. map form → Transaction
3. optimistic add в локальный state
4. append row в Google Sheets
5. обновить статус synced
```

---

## Этап 7 — история и фильтры

```text
widgets/transactions-table
features/filter-transactions
```

Фильтры:

```text
Дата от/до
Тип операции
Категория
Сумма от/до
Поиск по комментарию
Статус синхронизации
```

---

## Этап 8 — аналитика

```text
widgets/dashboard-summary
widgets/analytics-charts
entities/analytics
```

Карточки:

```text
Общий доход
Общий расход
Баланс
Расход за месяц
Средний расход в день
Кол-во операций
```

Графики:

```text
MonthlyBalanceChart
IncomeExpenseChart
CategoryPieChart
DailyExpenseLineChart
```

---

## Этап 9 — офлайн-очередь

```text
shared/lib/storage/indexed-db.service.ts
features/sync-transactions
```

Логика:

```text
Если Google недоступен или нет интернета:
  сохранить в IndexedDB
  показать pending

Когда интернет вернулся:
  отправить pending
  обновить syncStatus
```

---

## Этап 10 — полировка

```text
Темная тема
Адаптив под телефон
PWA manifest
Красивый sidebar
Анимации через Tailwind
Toast-уведомления
Skeleton loading
Error boundary
Страница “нет доступа к таблице”
Страница “таблица не настроена”
```

---

# 15. Как должен выглядеть flow приложения

```text
Открыл сайт
   ↓
Есть spreadsheetId?
   ├─ Нет → SetupPage
   └─ Да → DashboardPage
             ↓
        Есть Google token?
          ├─ Нет → показать кнопку Connect Google
          └─ Да → загрузить данные из Sheets
```

---

# 16. Что хранить локально

В `localStorage`:

```text
spreadsheetId
sheetName
currency
theme
language
lastSelectedCategory
```

В `IndexedDB`:

```text
transactionsCache
pendingTransactionsQueue
failedSyncQueue
lastSuccessfulSyncAt
```

---

# 17. Минимальная модель данных

```ts
export type Transaction = {
  id: string;
  date: string;
  kind: "income" | "expense";
  categoryId: string;
  categoryName: string;
  amount: number;
  signedAmount: number;
  currency: string;
  paymentMethod?: string;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
  syncStatus: "local" | "pending" | "syncing" | "synced" | "failed";
};
```

```ts
export type Category = {
  id: string;
  name: string;
  kind: "income" | "expense";
  color: string;
  icon: string;
  isDefault: boolean;
};
```

```ts
export type AppSettings = {
  spreadsheetId?: string;
  defaultCurrency: string;
  theme: "light" | "dark" | "system";
  language: "ru" | "uk" | "en";
};
```

---

# 18. Что обязательно нужно сделать, чтобы всё работало

```text
1. Google Cloud Project
2. Включить Google Sheets API
3. Создать OAuth Client ID
4. Добавить localhost и GitHub Pages в allowed origins
5. Настроить OAuth consent screen
6. Создать React app
7. Подключить Google Identity Services script
8. Реализовать получение access token
9. Реализовать append/read/update для Sheets API
10. Сделать setup таблицы
11. Сделать деплой на GitHub Pages
```

---

# 19. Что не надо делать

```text
Не хранить client_secret во frontend
Не использовать service account json во frontend
Не писать Google API вызовы прямо в компонентах
Не хранить access token как постоянную настройку
Не делать одну огромную страницу Dashboard на 1000 строк
Не смешивать UI, API, аналитику и валидацию в одном файле
Не дублировать компоненты
```

---

# 20. Как назвать проект

Хорошие названия:

```text
sheets-finance-tracker
sheetpay-tracker
ledger-sheets
personal-ledger-sheets
finance-sheets-pwa
payflow-sheets
```

Я бы выбрал:

```text
ledger-sheets
```

Коротко, понятно, не привязано только к выплатам. Потом можно расширить до расходов, доходов, аналитики и отчётов.

---

# 21. Идеальный roadmap

## Milestone 1 — Project Foundation

```text
Инициализация Vite React TS
Tailwind
FSD структура
Routing
Layout
UI-kit
Theme constants
ESLint/Prettier/Husky
GitHub Pages deploy
```

## Milestone 2 — Google Integration

```text
Google OAuth
Access token flow
Google Sheets client
Spreadsheet URL parser
Connection status
Error handling
```

## Milestone 3 — Spreadsheet Template

```text
Создание листов
Заголовки Ledger
Базовые категории
Summary formulas
MonthlyStats formulas
Template version
```

## Milestone 4 — Transactions MVP

```text
Форма операции
Zod validation
Append в Google Sheets
История операций
Чтение Ledger
Фильтры
```

## Milestone 5 — Analytics

```text
Summary cards
Monthly charts
Category charts
Balance chart
Google Sheets formulas
```

## Milestone 6 — Offline & Sync

```text
IndexedDB cache
Pending queue
Retry sync
Sync status
Conflict prevention
```

## Milestone 7 — UX Polish

```text
Mobile layout
Dark theme
Skeletons
Toasts
Error states
PWA manifest
Micro animations
```

---

# 22. Финальная архитектурная идея

Самое правильное решение для тебя:

```text
UI ничего не знает про Google Sheets напрямую.
UI вызывает features.
Features используют entities и shared api.
Google Sheets спрятан за DataSource adapter.
Аналитика считается отдельно чистыми функциями.
Таблица Google остаётся читаемой человеком.
Сайт остаётся красивым интерфейсом поверх этой таблицы.
```

То есть проект будет не “куча fetch-запросов из компонентов”, а нормальное приложение:

```text
Page → Widget → Feature → Entity → Shared API
```