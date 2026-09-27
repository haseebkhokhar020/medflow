# Security policy

MedFlow is an offline pharmacy **business-management** application. The owner confirmed the v1.0.0 core workflow on Windows 10; the v1.0.1 patch installers are CI-built but have not been independently installed and retested on Windows. The v1.1.0 medicine dictionary is reference data only and cannot verify a product or a prescription. Its Windows installers should still be tested on your own device before live use. It is **not** an independently security-audited or regulatory-certified medical product. The installers are currently unsigned.

Do not put patient information, credentials, live business databases, or backup archives in GitHub issues or pull requests. Never commit `*.sqlite`, the local `.medflow-data` folder, private keys, or `.env` secrets.

Report a security issue privately to the repository owner (for example via GitHub private vulnerability reporting if enabled). Do not open a public issue containing exploit details. Do not assume a guaranteed security-response SLA.

Passwords are hashed with scrypt, but the SQLite database and backups are **not encrypted at rest**. Protect workstation access and use full-disk encryption and secure backup storage. The browser HTTP bridge is for local development only; installed desktop builds use Electron IPC and do not run a web server. Back up data before updating.
