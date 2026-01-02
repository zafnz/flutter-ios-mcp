# Publishing Guide

This guide covers how to publish flutter-ios-mcp to npm.

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **npm login**: Run `npm login` and enter your credentials
3. **2FA enabled**: Recommended for security

## Before Publishing

### 1. Update Version

Follow [Semantic Versioning](https://semver.org/):

```bash
# Patch release (bug fixes): 0.1.0 -> 0.1.1
npm version patch

# Minor release (new features): 0.1.0 -> 0.2.0
npm version minor

# Major release (breaking changes): 0.1.0 -> 1.0.0
npm version major
```

### 2. Update package.json Metadata

Before first publish, update these fields in `package.json`:

```json
{
  "author": "Nick Clifford <nick@nickclifford.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/zafnz/flutter-ios-mcp.git"
  },
  "bugs": {
    "url": "https://github.com/zafnz/flutter-ios-mcp/issues"
  },
  "homepage": "https://github.com/zafnz/flutter-ios-mcp#readme"
}
```

### 3. Run Pre-publish Checks

The `prepublishOnly` script runs automatically, but you can test it manually:

```bash
npm run prepublishOnly
```

This runs:
- Clean build directory
- TypeScript compilation
- Linting
- Type checking
- All tests

## Publishing

### Dry Run (Recommended First Time)

See what will be published without actually publishing:

```bash
npm pack --dry-run
```

Or create a tarball to inspect:

```bash
npm pack
tar -tzf flutter-ios-mcp-*.tgz
rm flutter-ios-mcp-*.tgz
```

### Publish to npm

```bash
# Standard publish
npm publish

# First time publishing a scoped package as public
npm publish --access public
```

### Verify Publication

```bash
# Check npm registry
npm view flutter-ios-mcp

# Test installation
npx flutter-ios-mcp@latest --help
```

## Post-Publishing

### Tag the Release

```bash
git tag v0.1.0
git push origin v0.1.0
```

### Create GitHub Release

1. Go to https://github.com/zafnz/flutter-ios-mcp/releases
2. Click "Create a new release"
3. Select the tag (v0.1.0)
4. Add release notes from CHANGELOG
5. Publish release

## Publishing Checklist

- [ ] All tests passing (`npm test`)
- [ ] Linting passing (`npm run lint`)
- [ ] Type checking passing (`npm run typecheck`)
- [ ] README.md is up to date
- [ ] CHANGELOG.md updated with changes
- [ ] Version bumped appropriately
- [ ] package.json metadata correct (author, repo, etc.)
- [ ] Dry run successful (`npm pack --dry-run`)
- [ ] Published to npm (`npm publish`)
- [ ] Git tag created and pushed
- [ ] GitHub release created
- [ ] Verified with `npx flutter-ios-mcp@latest`

## Troubleshooting

### "Package already exists"

The package name is taken. Choose a different name or use a scoped package:

```json
{
  "name": "@zafnz/flutter-ios-mcp"
}
```

### "403 Forbidden"

- Ensure you're logged in: `npm whoami`
- Check you have publish permissions
- Enable 2FA if required

### "Files missing in package"

- Check `.npmignore` isn't excluding required files
- Verify with `npm pack --dry-run`
- Ensure `files` field in package.json includes `dist/`

## Unpublishing (Emergency Only)

You can unpublish within 72 hours, but it's discouraged:

```bash
npm unpublish flutter-ios-mcp@0.1.0
```

Instead, publish a patch version with fixes.

## Updating After Publish

To publish an update:

```bash
# 1. Make your changes
# 2. Bump version
npm version patch  # or minor/major

# 3. Publish
npm publish

# 4. Tag
git push origin v0.1.1
```
