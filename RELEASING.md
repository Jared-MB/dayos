# Releasing

Both packages are published from CI by pushing a version tag. Nothing is
published from a laptop.

## How authentication works

There is no npm token anywhere — not in the workflow, not in the repository
secrets. `@dayos/core` and `@dayos/next` each have a **trusted publisher**
configured on npmjs.com pointing at this repository and at
`.github/workflows/publish.yml`. The job authenticates by exchanging the OIDC
token that its `id-token: write` permission grants.

Two consequences worth knowing:

- **Renaming or moving `publish.yml` breaks publishing.** The filename is part
  of what npm matches against. Change it on npmjs.com first.
- Provenance is attached automatically. The workflow passes no `--provenance`
  flag on purpose; trusted publishing already does it.

## The steps

`main` rejects direct pushes — every commit needs a green `ci` check first — so
a release goes through a branch like anything else.

```sh
# 1. Branch off an up-to-date main
git switch main && git pull
git switch -c release/v0.2.0

# 2. Bump both packages to the same version
pnpm --filter "@dayos/*" exec npm version 0.2.0 --no-git-tag-version

# 3. Run what CI is going to run
pnpm install --frozen-lockfile && pnpm lint && pnpm check-types && pnpm test && pnpm build

# 4. Open the pull request
git commit -am "Release v0.2.0"
git push -u origin release/v0.2.0
```

Merge once `ci` is green. **Then**, and not before:

```sh
# 5. Tag on main
git switch main && git pull
pnpm release:tag
```

The version is read from the manifests rather than typed, and the tag is only
pushed after it confirms you are on `main`, that `main` matches `origin`, that
the working tree is clean, that both packages agree on the version, and that the
tag does not exist yet. It prints what it is about to publish and asks first.

Doing it by hand is `git tag -a v0.2.0 -m "v0.2.0" && git push origin v0.2.0`,
with none of that checked.

The tag push triggers `publish.yml`, which runs the tests and the build again,
checks the tag against the manifests, and publishes `@dayos/core` first and
`@dayos/next` after it.

## What will bite you

**Tag after merging, on `main`.** A squash merge rewrites the commit, so the SHA
on `main` is not the one on your branch. A tag placed on the branch commit points
at something outside `main`'s history, and tags here cannot be moved.

**Both packages always carry the same version.** The workflow refuses to publish
if a manifest disagrees with the tag. If only the core changed, `@dayos/next`
still goes out at the new version with no real changes. That is lockstep
versioning by choice, not a technical limit — relaxing the check in `publish.yml`
is what independent versioning would take.

**Tags are immutable.** The `tags` ruleset blocks updates and deletions on `v*`
with no bypass, so a tag on the wrong commit cannot be fixed in place. See below.

## Versioning

While on `0.x`, SemVer allows breaking changes in a minor:

- Breaking API change → `0.2.0`
- Fix or backwards-compatible addition → `0.1.1`

Move to `1.0.0` when the public API is settled enough that breaking it needs a
major.

## When something goes wrong

**A published version is permanent.** npm allows unpublishing within 72 hours,
and the name stays blocked for 24 hours afterwards. In practice a bad release is
fixed by publishing the next patch, never by replacing the broken one.

**Publish failed partway.** The job skips versions already on the registry, so
re-running it is safe: it will publish only what is missing. If `@dayos/core`
went out and `@dayos/next` did not, re-running finishes the job.

**The tag is on the wrong commit.** The ruleset has to be lifted for it:
Settings → Rules → Rulesets → `tags` → Enforcement `Disabled`, delete and
recreate the tag, then set it back to `Active`. Do this only if nothing was
published under it yet — if it was, the tag now describes what npm actually has,
and moving it makes the two disagree.
