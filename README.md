# MedFlow Desktop

**MedFlow 1.0** is an offline-first pharmacy business/POS application for Windows, with local SQLite storage and an Electron + React/TypeScript interface. The store owner has confirmed the complete core pharmacy workflow on **Windows 10**. No hosted database, cloud login, or internet connection is required for ordinary operations.

**Copyright and license:** Public source repository, **all rights reserved**. No permission to redistribute, rebrand, or commercially deploy the source is granted by its public availability. Downloading the official installer does not grant a source-code license.

## Install MedFlow

Download the current stable installer from the [official GitHub Releases page](https://github.com/haseebkhokhar020/medflow/releases/latest):

- `MedFlow-Setup-1.0.0-x64.exe` — 64-bit Windows.
- `MedFlow-Setup-1.0.0-ia32.exe` — 32-bit Windows.
- `SHA256SUMS.txt` — verify downloads if possible.

Run the `.exe`, follow the setup screens, and open MedFlow from the Start Menu. Users do **not** need Node.js, npm, Python, or SQLite installed. Installers are currently **unsigned**, so Windows SmartScreen may display a publisher warning. Only obtain installers from this repository's official Releases page. Tested user workflow: **Windows 10**; Windows 7/8/8.1/11 and each printer/scanner combination still require their own compatibility testing.

**Updating from 0.1.0:** Make a manual backup first and store a copy on another drive. Version 1.0 creates and verifies an additional pre-upgrade SQLite backup **before** it modifies an existing database. Customer data is stored outside the installation directory and is not removed by uninstalling or updating the application. Do not run multiple versions simultaneously.

## Included workflows

- First-run store setup; password-protected local accounts and role-checked operations.
- Products, validated CSV imports, barcode/generic/SKU lookup, suppliers, customers and balances.
- Batch purchases, FEFO point of sale, expired-stock blocking, prescription-required confirmation, receipt printing through the Windows print dialog, credit sales and payments.
- Sales and purchase returns, stock audit movements and adjustments, expiry alerts, operating expenses, finance overview, dashboard and CSV reports.
- Audit log, manual and optional daily-at-login database backups with rotation, verified restore with safety backup, diagnostic log export and optional labeled demo data.

## Data and security

- Business data: `<Electron userData>/data/medflow.sqlite`; backups: `data/backups`. Nothing is hosted remotely for core operation.
- Passwords use salted `scrypt` hashes; important business writes are SQLite transactions; price amounts are stored in integer minor currency units.
- Business databases and backups are **not encrypted at rest**. Protect Windows accounts, use full-disk encryption if needed, and retain independent backups.
- This is **not** an electronic health record or a medical advice tool. It is not independently security-audited or regulatory-certified.

## Develop and test

```sh
npm ci
npm test
npm run dev      # Browser development preview: Vite :5173, loopback-only API :4174
npm run build
```

The browser preview uses a local development HTTP bridge; the packaged desktop app uses context-isolated Electron IPC and launches no web server.

### Build Windows installers

On Windows, with Node 20 and C++ build tools if the native SQLite prebuild is unavailable:

```powershell
npm ci
npm test
npm run pack:win       # x64 NSIS installer
npm run pack:win32     # x86 NSIS installer
```

Installers are generated in `release/`. `.github/workflows/windows-build.yml` tests the app and compiles both architectures on Windows CI; manually dispatched runs retain short-lived artifacts for release preparation. `npm run pack:linux:win` can cross-build an installer with Linux NSIS but does not replace Windows CI or installation testing. GitHub Packages is designed for registries (npm/containers), not for a standalone Windows `.exe`: distribute the `.exe` through **GitHub Releases**.

## Support and limitations

See [architecture](docs/ARCHITECTURE.md), [known limitations and compatibility](docs/KNOWN_LIMITATIONS.md) and [security reporting](SECURITY.md). Remaining planned capabilities include multi-barcode support, granular permission configuration, full accounting/cash-flow reporting, XLSX import/export, formal stock counts and localization. Do not present this business application as a diagnostic or prescription recommendation system.
