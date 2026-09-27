# Security policy

MedFlow 1.0.0 is an offline pharmacy **business-management** application whose core workflow was confirmed by its owner on Windows 10. It is **not** an independently security-audited or regulatory-certified medical product. The installers are currently unsigned.

Do not put patient information, credentials, live business databases, or backup archives in GitHub issues or pull requests. Never commit `*.sqlite`, the local `.medflow-data` folder, private keys, or `.env` secrets.

Report a security issue privately to the repository owner (for example via GitHub private vulnerability reporting if enabled). Do not open a public issue containing exploit details. Do not assume a guaranteed security-response SLA.

Passwords are hashed with scrypt, but the SQLite database and backups are **not encrypted at rest**. Protect workstation access and use full-disk encryption and secure backup storage. The browser HTTP bridge is for local development only; installed desktop builds use Electron IPC and do not run a web server. Back up data before updating.
