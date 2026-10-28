# xCode — download site

Static download page for **xCode**, the editor for the X# language on Windows.

- **Site:** https://xxmomentum12.github.io/xcode-site/
- **Installer:** [xCodeSetup.exe](https://github.com/xxmomentum12/xcode-site/releases/latest/download/xCodeSetup.exe) (132 MB)
- **Portable:** [xCode-portable.exe](https://github.com/xxmomentum12/xcode-site/releases/latest/download/xCode-portable.exe) (118 MB)

The 132 MB installer is too large for GitHub Pages (100 MB per file), so it lives
in [Releases](https://github.com/xxmomentum12/xcode-site/releases). The page links
to the stable `releases/latest/download/...` URLs, which always serve the newest
release.

## Releasing a new version

1. Bump the version in `xcode/package.json`, rebuild the installer.
2. Rename the portable build to `xCode-portable.exe`.
3. Create a release tagged `vX.Y.Z` and attach both files:
   `xCodeSetup.exe` and `xCode-portable.exe`.
4. Update `<meta name="xcode-version">` and `<meta name="xcode-sha256">` in
   `index.html`.
5. Push the site changes; Pages redeploys in about a minute.

## Structure

```text
index.html          Single page: features, build examples, install, FAQ, download
assets/styles.css   Dark teal + mint theme
assets/site.js      Version/checksum display, copy buttons, mobile navigation
assets/icon.png     App icon
assets/screenshot.png
```

No build step, no dependencies: GitHub Pages serves the files as they are.
