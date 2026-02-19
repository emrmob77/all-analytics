# Release Checklist

## Critical Flow Smoke Tests
1. Register -> Login -> Dashboard access.
2. Notification preferences update -> trigger event -> delivery log visible.
3. Pricing -> Checkout session creation -> success/cancel routes.
4. Team invite and role update.
5. Support ticket creation and listing.

## Build and Validation
1. `npm run lint`
2. `npm run type-check`
3. `npm run test`
4. `npm run build`

## Deployment
1. Verify environment variables in target environment.
2. Deploy staging and run smoke checklist.
3. Promote to production.
4. Monitor `/api/v1/observability/events` after release.

## Rollback Plan
1. Revert to previous stable git SHA.
2. Rebuild and redeploy prior image.
3. Confirm auth, billing, and dashboard module recovery.
