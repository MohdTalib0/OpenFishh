# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in OpenFishh, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report via:
- Discord DM to a maintainer: [discord.gg/jMwfepkD](https://discord.gg/jMwfepkD)
- Email: mohammad.talib319@gmail.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge your report within 48 hours and work with you to understand and address the issue.

## Scope

This policy applies to:
- The OpenFishh backend (FastAPI + SQLite)
- The OpenFishh frontend (React + Vite)
- Docker configurations
- CI/CD workflows

## Best Practices for Users

- Never commit `.env` files or API keys
- Use Row Level Security if connecting to external databases
- Keep dependencies updated
