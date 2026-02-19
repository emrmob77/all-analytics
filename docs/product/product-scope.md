# Allanalytics SaaS Scope (MVP + V1)

## Personas
- Agency owner: Needs multi-brand visibility and billing controls.
- Performance marketer: Needs campaign-level insight and anomaly alerts.
- Analyst: Needs normalized data, reporting, and reproducible workflows.

## MVP Feature Set
- Unified dashboard with platform modules and custom filters.
- Connector onboarding for paid media, analytics, and commerce.
- Notification center + preferences + delivery logs.
- Workspace settings, RBAC, team management.
- Support center and searchable knowledge base.
- Pricing, checkout entry, and subscription management.

## V1 Extensions
- Advanced attribution models.
- AI workflow assistant (AllanalyticsAI).
- Expanded connector marketplace and integration request prioritization.
- SLO-based observability dashboards and automated release checks.

## Plan Matrix
| Plan | Brands | Team Members | Connectors | Notes |
| --- | ---: | ---: | ---: | --- |
| Free | 1 | 2 | 2 | Discovery and trial usage |
| Pro | 5 | 10 | 15 | Standard growth teams |
| Team | 20 | 40 | 40 | Multi-brand operations |
| Enterprise | Custom | Custom | Custom | SLA and security add-ons |

## Information Architecture
- Public site: `/saas`, `/features`, `/pricing`, `/security`, `/about`, `/contact-sales`, legal pages.
- Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`.
- App: dashboard modules + `/settings`, `/team`, `/integrations`, `/notifications`, `/support`, `/knowledge-base`, `/billing`, `/onboarding`.
