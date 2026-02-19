# Contributing to AdsPulse

## Development Workflow

1. Create a new branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the project conventions

3. Commit your changes
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. Push and create a PR
   ```bash
   git push origin feature/your-feature-name
   ```

5. Submit PR for review at https://app.devin.ai/review

## Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

## Code Style

- TypeScript strict mode
- Use shadcn/ui components
- Server Components by default
- Follow existing patterns in codebase

## PR Review

All PRs are reviewed using Devin AI at https://app.devin.ai/review
Simply paste your PR URL for automated code review.
