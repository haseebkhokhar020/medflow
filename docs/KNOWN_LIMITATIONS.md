# Known limitations and deployment gate

This repository contains a working application foundation, not a certified production release. Do not use it as the sole system of record for an operating pharmacy without the following verification.

## Required before production

1. Install and uninstall on **real** Windows 7, 8/8.1, 10, and 11 test machines as needed; test x64 and x86 separately. Electron 22 is used for the older Windows target, but compatibility is **not verified**.
2. Run the full 30-step first-run → restore acceptance workflow on Windows, with realistic pharmacy data.
3. Verify A4 and thermal printing, print-to-PDF, barcode scanners, power-loss recovery, permission boundaries, and backup recovery from removable media.
4. Sign releases with a trusted code-signing certificate; review Electron and dependency security advisories and commission a security audit.
5. Measure search, sales, expiry, and reports with 10,000 products and 100,000+ transactions. Some report queries cap output at 5,000 rows.
6. Document a controlled schema migration and upgrade/rollback strategy; test upgrades without loss of customer data.

## Features still incomplete

- Granular configurable permissions and dual authorization for sensitive actions.
- Multiple barcodes per product; configurable pricing/discount rules; batch-price overrides.
- Formal stock counts and transfers; recurring expenses; full accounting and cash-flow reporting.
- Excel XLSX import/export and complete global cross-entity search.
- Full eight-step setup, receipt format customization, and A4-specific layouts.
- Encryption-at-rest, encrypted backup files, multiple branches, and localization.
- Automated background backups without a sign-in event and cloud synchronization (not planned for local version 1).

The `README.md` lists what is currently implemented. This system must not diagnose or recommend medication.
