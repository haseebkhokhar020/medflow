# MedFlow architecture

MedFlow is a single-computer, local-first Electron application. Business records never require a hosted service.

```text
React/TypeScript UI (src/)
    ↓ IPC (desktop/preload.cjs, context isolation)
Electron main process (desktop/main.cjs)
    ↓ typed method dispatch + permission checks
Business logic (server/service.cjs)
    ↓ transactions and parameterized SQL
SQLite (Electron userData/data/medflow.sqlite)
```

The browser development preview uses `server/http.cjs` instead of Electron IPC. The HTTP bridge is **for development only** and is not started by the desktop build. It binds to loopback; Vite proxies `/api` for the preview.

## Data and security boundaries

- The database lives in the OS application-data directory, not the install directory. `data/backups`, `data/logs`, `data/reports`, and `data/uploads` are separated.
- All mutation methods pass through the local service and server-side role checks. Passwords are salted with `scrypt`; session tokens remain in the main process memory.
- Stock changes are recorded in `movements`; sensitive operations are recorded in `audit`.
- Sales, purchases, returns, stock adjustments, and payments use SQLite transactions. Selling allocates non-expired batches FEFO.
- Product prices are integer minor currency units; quantities are whole units.
- Database backups use SQLite's online backup facility. Restore checks integrity, creates a safety backup, and invalidates sessions.

## Windows builds

- `npm run pack:win` / `npm run pack:win32`: build NSIS on Windows with electron-builder.
- `npm run pack:linux:win`: evaluation-only Linux cross-build with a Linux NSIS compiler and the matching Windows/Electron SQLite addon. It **does not** test a Windows install.
- CI checks tests and both Windows installer architectures. Artifacts are not published as a GitHub Release.

## Scaling and future work

The database has indexes for FEFO batches and transactions; product and stock screens use pagination. Some reports and transaction lists still have fixed row limits. Separate modules for migrations, fine-grained permissions, printing, and reporting are future refactoring targets. See [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) before deployment.
