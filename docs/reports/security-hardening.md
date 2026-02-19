# Security Hardening Summary

## Application-Level Controls
- JWT verification and tenant isolation checks in API handlers.
- API rate limiting with per-route keys and retry headers.
- Input sanitization + validation helpers.
- Role checks through route-level RBAC utilities.

## Transport & Browser Protections
- Security headers configured in `next.config.ts`:
  - Content-Security-Policy
  - Strict-Transport-Security
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy

## Secret and Credential Guidance
- Keep `API_JWT_SECRET` and integration credentials in environment variables.
- Rotate OAuth/API credentials on policy intervals.
- Restrict production secrets to deployment runtime only.

## Release Security Checklist
1. Validate no secrets in git diff.
2. Run type-check, lint, and build.
3. Verify auth routes and protected route middleware behavior.
4. Confirm security headers on key pages.
