#!/usr/bin/env bash
#
# Tags the current commit with the version in the manifests and pushes it,
# which is what triggers publishing.
#
# Every check here guards something that cannot be undone once the tag is
# pushed: the `tags` ruleset blocks updates and deletions, and whatever gets
# published under the tag stays on npm.

set -euo pipefail

die() {
  echo "release:tag: $1" >&2
  exit 1
}

cd "$(dirname "$0")/.."

# The tag has to sit on main. A squash merge rewrites the commit, so a tag
# placed on the branch would point outside main's history.
branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "main" ] || die "on branch '$branch'; releases are tagged on main"

if ! git diff --quiet || ! git diff --cached --quiet; then
  die "working tree has uncommitted changes"
fi

# The publish workflow refuses a tag that disagrees with the manifests. Catching
# it here costs a second instead of a full build.
core=$(node -p "require('./packages/core/package.json').version")
next=$(node -p "require('./packages/next/package.json').version")
[ "$core" = "$next" ] ||
  die "packages disagree: core is $core, next is $next"

tag="v$core"

if git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
  die "$tag already exists locally"
fi

if git ls-remote --exit-code --tags origin "$tag" >/dev/null 2>&1; then
  die "$tag is already on origin, and tags here cannot be moved"
fi

# Tagging a commit that never reached origin/main would publish code nobody can
# see, so this compares against the remote rather than a stale local ref.
git fetch --quiet origin main
head=$(git rev-parse HEAD)
remote=$(git rev-parse origin/main)
[ "$head" = "$remote" ] ||
  die "HEAD is not origin/main; pull or push first"

echo "  tag:     $tag"
echo "  commit:  $(git log -1 --format='%h %s')"
echo "  publish: @dayos/core@$core and @dayos/next@$next"
echo
read -r -p "This cannot be undone. Push it? [y/N] " reply
[ "$reply" = "y" ] || [ "$reply" = "Y" ] || die "aborted"

git tag -a "$tag" -m "$tag"
git push origin "$tag"

echo
echo "pushed $tag — publishing at https://github.com/Jared-MB/dayos/actions"
