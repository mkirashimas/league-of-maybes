# Workflow

## Branches

| Branch                                      | Purpose                                                           | Merges into                            |
| ------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------- |
| `main`                                      | Production. Deploys live.                                         | none                                   |
| `development`                               | Integration branch and the default target for every pull request. | `main`, through a release pull request |
| `stage/NN-<slug>`                           | One branch per stage, e.g. `stage/01-shell`                       | `development`                          |
| `chore/<slug>`, `fix/<slug>`, `docs/<slug>` | Setup work, fixes between stages, docs-only changes               | `development`                          |

- Work branches start from `development`, never from `main`.
- Merges use **squash**, so each branch becomes one commit.
- After a stage merges, tag it on `development` (`stage-01`, `stage-02`, …).
- `development` is the default branch on GitHub (Settings → General → Default branch).

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` a new feature
- `fix:` a bug fix
- `docs:` documentation only
- `chore:` setup, tooling or dependencies
- `refactor:` code changes that don't change behavior

Example: `feat(roster): league table with status filter`.

## Stage loop (PowerShell)

```powershell
git switch development; git pull
git switch -c stage/01-shell
# …work, commit…
git push -u origin stage/01-shell
```

Then open a pull request from `stage/01-shell` into `development`. Either:

- open `https://github.com/mkirashimas/league-of-maybes/pull/new/stage/01-shell`, or
- with the GitHub CLI: `gh pr create --base development --fill`.

After review and green CI:

```powershell
# merge on GitHub with "Squash and merge" and delete the branch, then:
git switch development; git pull
git tag stage-01; git push origin stage-01
git branch -d stage/01-shell
```

Use `-D` if git refuses to delete the branch after a squash merge. A squash merge doesn't keep the branch's own commits, so git can't tell that the branch was merged.

## Every pull request

- [ ] `yarn lint` and `yarn build` pass. CI runs both.
- [ ] The stage doc in `docs/stages/` is updated: as-built notes, deviations, verification ticked.
- [ ] The status in the root `README.md` is updated.
- [ ] Any new decision is added to `docs/decisions.md`.

## Releases

When `development` has something worth shipping, open a pull request from `development` into `main` titled `release: <summary>`. Use **Create a merge commit**, not squash. That keeps `main` and `development` sharing the same history, so later releases stay simple.

Deploying is manual until GitHub Actions deploys are set up (below):

```powershell
yarn build
firebase deploy --only hosting,firestore
```

## CI

`.github/workflows/ci.yml` runs on every pull request into `development` or `main`, and on every push to them. It runs on Node 22:

1. `yarn install --frozen-lockfile`
2. `yarn lint`
3. `yarn build`

## Later: preview and live deploys

Once the Firebase CLI is logged in (`firebase login`), run `firebase init hosting:github` and answer:

- the build script: `yarn install --frozen-lockfile && yarn build`
- deploy on merge: yes, branch `main`

This adds:

- a preview URL posted on each pull request
- a live deploy when anything merges into `main`
- a GitHub secret `FIREBASE_SERVICE_ACCOUNT_LEAGUE_OF_MAYBES`. It lives only in GitHub and is never committed.

## Protecting branches (optional)

Rulesets that require pull requests and green CI on `main` and `development` need GitHub Pro if the repo is private. Without Pro, follow the pull-request flow above by habit.
