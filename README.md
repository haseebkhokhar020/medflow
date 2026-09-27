# MedFlow Desktop

> **Evaluation software.** Public source repository, **all rights reserved**: no open-source reuse or redistribution license is granted. Do not use live pharmacy data until Windows acceptance testing and security review are completed.

Local-first pharmacy management application. Electron 22 + React/TypeScript + SQLite (`better-sqlite3`). No cloud dependencies are used for normal operation. Customer data is stored under Electron's per-user `userData/data` directory, never alongside the installed application.

## What works

- First-run setup and password-protected users (scrypt password hashes); Owner, Manager, Cashier, Inventory, and Accountant server-enforced role permissions.
- Product catalog, barcode / generic / SKU lookup, validated CSV product import (up to 2,000 rows per file).
- Supplier and customer records; batch-based purchases; transactional, FEFO sales with expiry blocking, prescription confirmation, credit sales and customer/supplier payments.
- Stock adjustments and movements; returns against original sale items; expenses; finance overview; CSV reports; thermal-style HTML receipt print / print-to-PDF.
- Auditable actions, notifications derived from live data, manual and optional daily-at-login SQLite backups (14-copy rotation), diagnostic log export, and guarded restore with a safety backup.
- Optional clearly marked demo products, removable if they have no transaction history.

## Run / test

```sh
npm ci
npm test
npm run dev      # Browser development preview: Vite :5173, local API :4174
npm run build
```

The browser preview uses a **development-only** localhost API. The packaged Electron application instead uses a context-isolated preload IPC bridge; it does not launch or require an HTTP server.

### Windows installer

Build **on Windows** with Node 20 and native build tools (Visual Studio C++ build tools if a prebuilt SQLite addon is unavailable):

```powershell
npm ci
npm test
npm run pack:win       # x64 NSIS installer
npm run pack:win32     # x86 NSIS installer; requires 32-bit native addon build support
```

Installers appear under `release/`. GitHub Actions workflow `.github/workflows/windows-build.yml` automates both builds. The supplied `MedFlow-Setup-0.1.0-x64.exe` is a compiled but **unverified** NSIS installer. An evaluation x64 NSIS installer can also be cross-built on Linux with `npm run pack:linux:win` using a local `makensis` binary and the Windows SQLite prebuild. That build is **not tested on Windows** and its EXE resource icon is not edited without Wine. For a verified installer, build and test on Windows. Electron 22 is used because Electron 23+ dropped Windows 7/8/8.1 support; **compatibility of the installer on real Windows 7–11 machines has not been validated here**. Future Electron upgrades should be accompanied by a separate legacy build strategy. The installer is not code signed.

## Linux NSIS cross-build (unverified)

Run `npm run pack:linux:win` after obtaining a Linux NSIS `makensis` binary (set `MAKENSIS` if necessary). The script bundles the Windows Electron app, installs the matching Windows Electron SQLite addon and compiles `installer/MedFlow.nsi` into `release/MedFlow-Setup-0.1.0-x64.exe`. The NSIS installer creates Start Menu shortcuts, offers an optional Desktop shortcut, registers with Apps & Features and preserves app-data on uninstall. This is **a compiled artifact, not a passed installation test**.

## Data and security

- Customer database: `<Electron userData>/data/medflow.sqlite` (SQLite WAL mode; backups in `data/backups`; directories also reserved for logs, reports and uploads).
- Local files are **not encrypted at rest**. Use Windows account permissions, disk encryption and offline encrypted storage for backups containing sensitive customer data.
- Keep a copied backup on a separate device. Restore requires an Owner account and typed confirmation, checks SQLite integrity, creates a pre-restore safety backup, and ends all sessions.
- Prices are stored as integer minor currency units; quantities as whole units. Amounts shown in the UI are converted to major units.
- Sale/purchase/return/payment/adjustment writes are performed inside SQLite transactions. FEFO selection excludes expired batches; all stock deltas create movement records.

## Scope / not yet production-ready

This is a working application foundation and tested core workflow, **not a certified production release**. Before deployment: run and sign Windows installers on each supported OS/architecture; test thermal/A4 printers, USB scanners, backups on removable media, high-volume pagination/exports and power-loss recovery; commission a security review. Remaining requested workflows include multi-barcode support, configurable granular permissions, recurring expenses, full accounting/cash-flow reports, automated migration versioning, timed background backups independent of sign-in, and localization. CSV export is supported; XLSX import/export is not. Receipts can be saved as PDF via the OS print dialog. No medical advice or diagnosis features are provided.

See [architecture](docs/ARCHITECTURE.md), [deployment gate and feature gaps](docs/KNOWN_LIMITATIONS.md), and [security policy](SECURITY.md). This repository intentionally does not contain Windows installer binaries, databases, or backups.
