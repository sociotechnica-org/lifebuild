# Security Policy

## Reporting Security Vulnerabilities

We take the security of Work Squared seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to jess@jessmart.in with:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Any relevant proof-of-concept code
- Your contact information

We will acknowledge receipt of your report within 48 hours and work with you to understand and address the issue promptly.

## Supported Versions

As this project is under active development, we recommend always using the latest version from the main branch.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :x:                |

## Security Best Practices

When deploying Work Squared:

1. **Environment Variables**: Never commit `.env` files or API keys to version control
2. **Authentication**: Always enable authentication in production (`REQUIRE_AUTH=true`)
3. **Secrets Management**: Use proper secret management for JWT secrets and API keys
4. **HTTPS**: Always use HTTPS in production deployments
5. **Updates**: Keep dependencies up to date with regular security audits

## Dependencies

We regularly audit our dependencies for known vulnerabilities using:

```bash
pnpm audit
```

If you discover a vulnerability in one of our dependencies, please let us know so we can update accordingly.