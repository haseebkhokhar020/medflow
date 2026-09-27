# Known limitations and compatibility

The store owner confirmed the full core workflow on **Windows 10** before the 1.0 stable release. That is not a certification for every OS, machine, printer, scanner, or pharmacy policy. Preserve an independent backup and evaluate the application in your own environment.

## Compatibility and operating checks

1. The Windows x64 and x86 installers compile and backend tests pass in Windows CI. Actual installation/runtime compatibility of Windows 7/8/8.1/11 and 32-bit systems still requires testing on those devices. Electron 22 was selected for older Windows support.
2. Repeat the sale → return → credit payment → expense → report → backup → restore workflow after upgrades and when deploying to another store.
3. Verify your thermal/A4 printers, print-to-PDF, USB barcode scanners, power-loss recovery, permissions, and backup recovery on removable media locally.
4. Installers are unsigned. A security audit, code-signing certificate, and explicit operational procedures are appropriate before wider deployment.
5. Measure sales and reports on your actual data volumes. Some report queries cap output at 5,000 rows.
6. Version 1.0 creates a verified pre-upgrade SQLite backup when it opens an older database; still create and retain a manual backup **before** updating. Independent rollback/versioned schema migrations need further development.

## Features still incomplete

- Granular configurable permissions and dual authorization for sensitive actions.
- Multiple barcodes per product; configurable pricing and discount rules; batch-price overrides.
- Formal stock counts and transfers; recurring expenses; full accounting and cash-flow reporting.
- Excel XLSX import/export and complete global cross-entity search.
- Full eight-step setup, receipt format customization and A4-specific layouts.
- Encryption at rest, encrypted backup files, multiple branches and localization.
- Timed background backups without a sign-in event and automatic cloud sync (the latter is not part of local version 1).

MedFlow does not diagnose, advise on treatment, or recommend medication.

## Offline medicine dictionary (v1.1.0)

The bundled finder contains six manually verified Pakistan-market Panadol examples and 17,378 current NLM RxTerms entries reflecting mostly US terminology. It is neither a complete worldwide product list nor a DRAP registry or price list. Verify the physical pack, local registration, selling unit, prescription status, current shelf price, barcode, batch and expiry; the catalogue never creates stock or guarantees availability. See [data provenance and usage](MEDICINE_CATALOG.md).
