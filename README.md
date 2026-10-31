# DzKitab Backend

**Project summary**

DzKitab is a backend API built with NestJS and TypeScript that powers a book marketplace/listing application. It provides modules to manage books, user accounts, listings, offers, confirmations, listing photos, history, authentication, mail, and application configuration. The codebase follows a modular NestJS structure in `src/` and is designed for clarity and extensibility.

**Architecture & Tech Stack**

- Framework: NestJS (TypeScript)
- Runtime: Node.js
- ORM / Persistence: (project contains database configuration under `src/global/config/database.config.ts` — adjust to your DB of choice)
- Auth: JWT (configured in `src/global/config/jwt.config.ts`)
- Mailer: Global mailer module (`src/global/mailer/global-mailer.module.ts`)
- Passwords: bcrypt helper/config (`src/global/config/bcrypt.config.ts`)

**Repository layout (important files & folders)**

- `src/app.module.ts` — root Nest module.
- `src/main.ts` — application bootstrap.
- `src/modules/basic/` — primary business features grouped by domain:
  - `books/` — book entities, service, module (`books.module.ts`, `books.service.ts`, `entities/book.entity.ts`).
  - `listings/` — create/search/update listings, controller/service and DTOs (`listings.controller.ts`, `listings.service.ts`, `dto/*.ts`).
  - `offers/` — offers management (`offers.controller.ts`, `offers.service.ts`, `entities/offer.entity.ts`).
  - `confirmations/` — confirmation flow endpoints and DTOs (`confirmations.controller.ts`).
  - `listing-photos/` — photo handling for listings.
  - `history/` — persistent audit or history records.
  - `users/` — user accounts and user-related operations (`users.module.ts`, `users.service.ts`).
- `src/modules/global/` — global shared configuration and providers (DB, JWT, mailer, environment configs).
- `src/modules/shared/` and `src/shared/` — shared auth module, guards, DTOs and reusable decorators.
- `src/utils/error-handler.ts` — centralized error handling utilities.
- `test/` — end-to-end tests (`app.e2e-spec.ts`, `offers.e2e-spec.ts`).

**Features (high-level)**

- Book management: CRUD or read operations for books to populate listings.
- Listings: Create, search, and manage marketplace listings for books.
- Offers: Submit, list, and manage offers on listings.
- Confirmations: Confirm purchases or actions (email/push flows integrated via mailer).
- Photos: Upload and associate photos with listings (listing-photos module).
- Users & Auth: Registration, login, JWT-based auth, role-based access via decorators/guards.
- History/Audit: Record changes and user actions for traceability.
- Global configuration: Centralized environment, database, JWT, mailer, and bcrypt configs.

**API surface (typical endpoints)**

The project uses controllers located in `src/modules/basic/`. Expected endpoints (confirm exact routes in code):

- `POST /auth/register` — register a new user.
- `POST /auth/login` — user login (returns JWT).
- `GET /books` — search/list books.
- `GET /books/:id` — get a single book.
- `POST /listings` — create a listing (auth required).
- `GET /listings` — search listings (supports DTO-based search filters).
- `PUT /listings/:id` — update a listing (owner or admin only).
- `POST /offers` — create an offer on a listing.
- `GET /offers` — list offers (filter by user/listing).
- `POST /confirmations` — confirm a purchase or action.
- `POST /listing-photos` — upload photos for a listing.

Note: Exact route paths, query parameters, and request/response shapes are defined by controller files and DTOs found under each module's `dto/` folder (for example: `src/modules/basic/listings/dto/`). Use those DTOs as the canonical API contract.

**Data models**

Primary entities live under each module's `entities/` folder. Examples:
- `Book` — `src/modules/basic/books/entities/book.entity.ts`.
- `Listing` — `src/modules/basic/listings/entities/listing.entity.ts`.
- `Offer` — `src/modules/basic/offers/entities/offer.entity.ts`.
- `User` — `src/modules/basic/users/entities/user.entity.ts`.
- `Confirmation` — `src/modules/basic/confirmations/entities/confirmation.entity.ts`.

Open these files to see fields, relations, and validation decorators.

**Environment variables**

Create a `.env` file in the project root (or use another secrets manager) with variables similar to the following (adjust names to match the project's config files):

- `NODE_ENV=development`
- `PORT=3000`
- `DATABASE_URL=` or DB-specific variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`)
- `JWT_SECRET=` — secret used to sign JWTs
- `JWT_EXPIRES_IN=3600s`
- `MAILER_HOST=`
- `MAILER_PORT=`
- `MAILER_USER=`
- `MAILER_PASS=`
- `BCRYPT_SALT_ROUNDS=`

Check `src/modules/global/config` and `src/global/config` for exact environment variable names and required values.

**Setup & Running (development)**

1. Install dependencies (npm):

```bash
npm install
```

2. Run in development mode (typical NestJS scripts; verify `package.json` scripts):

```bash
npm run start:dev
```

3. Build for production:

```bash
npm run build
npm run start:prod
```

4. Running tests (unit/e2e):

```bash
npm run test
npm run test:e2e
```

If your project uses `pnpm` or `yarn`, substitute commands accordingly.

**Configuration & Customization**

- Database: Update `src/global/config/database.config.ts` with your database client and connection string.
- Mailer: Edit `src/global/config/mailer.config.ts` for SMTP or mail provider credentials.
- JWT: Adjust `src/global/config/jwt.config.ts` for token signing and expiry.
- Bcrypt: Configure salt rounds in `src/global/config/bcrypt.config.ts`.

**Error handling & logging**

- Centralized utilities live in `src/utils/error-handler.ts`. Controllers and services should use these utilities consistently for structured error responses.

**Testing**

- E2E tests live in `test/`. Use `npm run test:e2e` to run end-to-end tests. If tests need a test database or mocked mailer, ensure environment variables or test fixtures are set.