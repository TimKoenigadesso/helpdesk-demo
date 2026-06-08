#!/bin/bash
set -e

echo "=== Demo Reset gestartet ==="

echo "Lösche Feature-Branches..."
git fetch --prune 2>/dev/null || true
for branch in $(git branch -r 2>/dev/null | grep 'origin/feature/' | sed 's/.*origin\///'); do
  git push origin --delete "$branch" 2>/dev/null && echo "  Gelöscht: $branch" || true
done

echo "Schließe offene Merge Requests..."
MRS=$(curl -sf -H "PRIVATE-TOKEN: $GITLAB_ACCESS_TOKEN" \
  "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests?state=opened" 2>/dev/null \
  | python3 -c "import sys,json; [print(mr['iid']) for mr in json.load(sys.stdin)]" 2>/dev/null || echo "")
for MR_IID in $MRS; do
  curl -sf -X PUT -H "PRIVATE-TOKEN: $GITLAB_ACCESS_TOKEN" \
    "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$MR_IID" \
    -d "state_event=close" > /dev/null 2>&1 && echo "  MR !$MR_IID geschlossen" || true
done

echo "Setze Datenbank zurück..."
git checkout main -- db/seed.db 2>/dev/null || echo "  Seed-DB nicht gefunden, überspringe"

echo "=== Demo Reset abgeschlossen ==="
