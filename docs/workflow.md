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

Merging the release pull request deploys automatically (see "Automatic deploy" below). To deploy again without a new merge, go to GitHub → Actions → **deploy** → **Run workflow** on `main`. To deploy by hand from the PC as a fallback:

```powershell
yarn build
firebase deploy --project league-of-maybes
```

## CI

`.github/workflows/ci.yml` runs on Node 22:

- on every pull request into `development` or `main`
- on every push to `development`
- when `deploy.yml` calls it, before each deploy (pushes to `main`)

Two jobs:

1. **`ci`**: `yarn install --frozen-lockfile`, then `yarn lint` and `yarn build`, for the root and for `functions/`.
2. **`rules`**: the Firestore rule tests in the emulator (`yarn test:rules`).

## Automatic deploy

`.github/workflows/deploy.yml` runs on every push to `main`, i.e. each merged release:

1. The `checks` job runs `ci.yml`. If anything fails, nothing is deployed.
2. The `deploy` job runs `yarn build`, then `firebase deploy --only hosting,firestore,functions --force`, to project `league-of-maybes`.

Its history is in GitHub → Actions → **deploy**, and in Settings → Environments → `production`.

**Auth is keyless (Workload Identity Federation).**

- GitHub gets a short-lived token from Google for this one repository and for the `main` branch only. Pull requests, other branches and forks can't deploy.
- No service-account key exists, so there is nothing to leak or rotate.

### One-time setup

Open [Cloud Shell](https://console.cloud.google.com/?project=league-of-maybes&cloudshell=true) (Google Cloud console, project `league-of-maybes`, the `>_` icon) and paste:

```sh
PROJECT_ID=league-of-maybes
REPO=mkirashimas/league-of-maybes
SA=github-deployer@$PROJECT_ID.iam.gserviceaccount.com
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud config set project $PROJECT_ID

# 1. The deploy service account.
gcloud iam service-accounts create github-deployer --display-name="GitHub Actions deploy"

# 2. Trust GitHub's tokens, but only from this repo's main branch.
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc league-of-maybes   --location=global --workload-identity-pool=github   --issuer-uri="https://token.actions.githubusercontent.com"   --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref"   --attribute-condition="assertion.repository=='$REPO' && assertion.ref=='refs/heads/main'"

# 3. Let that repo act as the service account.
gcloud iam service-accounts add-iam-policy-binding $SA   --role=roles/iam.workloadIdentityUser   --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"

# 4. What a deploy needs: Hosting, rules, indexes, Functions v2 with Scheduler and Firestore triggers.
for ROLE in firebase.admin cloudfunctions.admin run.admin eventarc.admin cloudscheduler.admin   artifactregistry.admin iam.serviceAccountUser serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA"     --role="roles/$ROLE" --condition=None --quiet > /dev/null && echo "granted $ROLE"
done

# 5. The two values for GitHub.
echo "GCP_WORKLOAD_IDENTITY_PROVIDER = projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/league-of-maybes"
echo "GCP_DEPLOY_SERVICE_ACCOUNT     = $SA"
```

Then go to GitHub → the repo → Settings → Secrets and variables → Actions → **Variables** tab → **New repository variable**, and add both printed values under those names. They are identifiers, not secrets.

**If a deploy fails on a permission,** the log names the missing permission (e.g. `...permission denied on resource...`). Grant the matching role with step 4's command, then use **Re-run jobs** on the failed run.

## Protecting branches (optional)

Rulesets that require pull requests and green CI on `main` and `development` need GitHub Pro if the repo is private. Without Pro, follow the pull-request flow above by habit.
