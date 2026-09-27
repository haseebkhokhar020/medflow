# Security policy

**MedFlow 0.1.0 is evaluation software. It is not approved for production pharmacy data.**

Do not put patient information, credentials, live business databases, or real backup archives in GitHub issues or pull requests. Never commit `*.sqlite`, the local `.medflow-data` folder, private keys, or `.env` secrets.

Report a security issue privately to the repository owner (for example through GitHub's private vulnerability reporting if enabled); do **not** open a public issue containing exploit details. No security-support SLA is promised for the evaluation version.

Passwords are hashed with scrypt, but SQLite files and manual backups are **not encrypted at rest**. Protect workstation access and use full-disk encryption and secure backup storage. The browser HTTP bridge is only for local development; the installed desktop application uses IPC and does not run a web server.
