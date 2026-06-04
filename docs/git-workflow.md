# BloodLink Git Workflow

BloodLink uses a Git Flow-inspired workflow.

## Branches

- `main`: production-ready code only.
- `develop`: integration branch for all feature work.
- Feature branches must start from `develop`:
  - `feature/authentication`
  - `feature/profile-management`
  - `feature/blood-requests`
  - `feature/donor-matching`
  - `feature/maps-osm`
  - `feature/notifications`

## Exact Git commands

Set the GitHub remote if it is missing:

```bash
git remote add origin https://github.com/seven-err/BloodLink.git
```

Rename local `master` to `main` if needed:

```bash
git branch -m master main
```

Create and push `main`:

```bash
git checkout main
git push -u origin main
```

Create and push `develop` from `main`:

```bash
git checkout -b develop
git push -u origin develop
```

Create feature branches from `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/authentication
git push -u origin feature/authentication

git checkout develop
git checkout -b feature/profile-management
git push -u origin feature/profile-management

git checkout develop
git checkout -b feature/blood-requests
git push -u origin feature/blood-requests

git checkout develop
git checkout -b feature/donor-matching
git push -u origin feature/donor-matching

git checkout develop
git checkout -b feature/maps-osm
git push -u origin feature/maps-osm

git checkout develop
git checkout -b feature/notifications
git push -u origin feature/notifications
```

## GitHub branch protection

Use GitHub Settings > Branches > Branch protection rules.

Protect `main`:

- Require a pull request before merging.
- Require at least 1 approval.
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging.
- Require the `Validate` CI check.
- Block force pushes.
- Block deletions.
- Restrict direct pushes.

Protect `develop`:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require the `Validate` CI check.
- Block force pushes.
- Block deletions.

Equivalent GitHub CLI commands:

```bash
gh repo edit seven-err/BloodLink --default-branch main

gh api repos/seven-err/BloodLink/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Validate"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

gh api repos/seven-err/BloodLink/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Validate"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Commit convention

All commits must use Conventional Commits:

```text
type(scope): short description
```

Examples:

```text
feat(auth): add phone OTP login
feat(matching): implement donor proximity scoring
fix(maps): resolve OpenStreetMap tile issue
refactor(profile): optimize profile service
chore(deps): update dependencies
docs(readme): update setup guide
```

Allowed scopes are configured in `commitlint.config.js`.

## Local quality gates

Before each commit, Husky runs:

```bash
npm run lint
npm run typecheck
```

Before each merge, GitHub Actions runs:

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --if-present
```
