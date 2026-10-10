# Changesets

This folder holds [changesets](https://changesets.dev): short notes describing changes that should be released.

Run `pnpm changeset` in your PR and pick a bump type:

- `patch`: bug fixes and other compatible changes
- `minor`: new features, and breaking changes while the version is `0.x`
- `major`: breaking changes (after `1.0.0`)

Changes that don't affect the published package (tests, docs, CI) don't need a changeset.
