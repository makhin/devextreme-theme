# @smbc/devextreme-theme

Internal SMBC theme and corporate assets for DevExtreme **26.1.4**, based on
`fluent.blue.light.compact`. Framework-independent ESM; React is not required.

## Installation

Configure the `@smbc` scope to use your approved internal registry in your local
npm configuration, then install:

```sh
npm install @smbc/devextreme-theme devextreme@26.1.4
```

The peer range is `~26.1.4` (26.1 patch releases only). Generation uses exactly
26.1.4; regenerate and review the reference page before widening compatibility.
For React, install matching `devextreme-react` separately.

## Basic usage

```ts
import '@smbc/devextreme-theme/styles.css';
```

This loads local fonts, semantic tokens, generated DevExtreme CSS, and corporate
overrides, in that order. Do not also load a stock DevExtreme theme. Keep
`class="dx-viewport"` on the application's body or themed container.
Application layouts, document resets, `.app-*` patterns and navigation are owned
by the consumer. The `smbc-style` demo retains its application CSS before the theme to
preserve its existing cascade.

Advanced CSS entry points: `tokens.css`, `fonts.css`, `devextreme.css`, and
`overrides.css`. Most applications need only `styles.css`.

## Logo and favicon

```tsx
import { smbcLogoUrl, smbcFaviconUrl } from '@smbc/devextreme-theme/assets';

<img src={smbcLogoUrl} alt="SMBC" />
```

In a browser bootstrap:

```ts
import { smbcFaviconUrl } from '@smbc/devextreme-theme/assets';

const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  ?? document.createElement('link');
icon.rel = 'icon';
icon.type = 'image/x-icon';
icon.href = smbcFaviconUrl;
document.head.append(icon);
```

The root entry also exports both URLs and does not import DevExtreme. Assets use
module-relative `new URL(..., import.meta.url)` expressions that Vite rewrites
in client builds, including non-root deployment paths. These URL values are not
server-rendered public URLs: apply them in the browser when using SSR.
See [Vite asset handling](https://vite.dev/guide/assets#new-url-url-import-meta-url).

Direct asset exports are also available where supported by the bundler:

```ts
import logoUrl from '@smbc/devextreme-theme/assets/smbc-logo.svg';
import faviconUrl from '@smbc/devextreme-theme/assets/favicon.ico';
```

No manually copied public-directory assets are needed. For a static HTML-only
pipeline, copy the exported favicon during the build, not into the application's
source tree.

## Optional visualization palette

This is a framework-independent theme API. `smbc-style` does not render charts
or register this palette. The snippet below describes palette integration for
a chart implementation; it does not authorize direct vendor imports in an
application using the `@smbc/ui` boundary. Such applications need a shared chart
API before adding chart controls.

Load the CSS before calling the registration function in a browser:

```ts
import '@smbc/devextreme-theme/styles.css';
import {
  registerSmbcVizPalette,
  SMBC_VIZ_PALETTE_NAME,
} from '@smbc/devextreme-theme/viz';

registerSmbcVizPalette();
```

```tsx
import type { Palette } from 'devextreme/common/charts';

<Chart palette={SMBC_VIZ_PALETTE_NAME as Palette} />
```

DevExtreme 26.1's TypeScript `Palette` union only lists built-in names, so its
custom registered name needs a type assertion at the consumer boundary.
Registration reads the semantic data-series, indicating, and gradient tokens;
missing tokens throw explicit errors. Call it again after intentionally changing
these token values. Importing the module never reads the DOM or registers a
palette. Calling it without a browser document throws a descriptive error.
The private `#palette` conditional import uses DevExtreme's standard bundler
entry in browsers and its CommonJS entry in Node, where directory ESM imports
are unsupported. This keeps browser registration in the same registry as charts.

## Design tokens

`src/tokens.css` is the canonical source for palette, semantic colours,
typography, spacing, borders, radii, outlines, shadows, motion, focus and charts.
Existing custom property names are preserved. Prefer semantic roles:

```css
.example {
  color: var(--color-text-primary);
  background: var(--color-surface-default);
  border-color: var(--color-border-default);
}
```

## Theme development

This is the standalone source project for `@smbc/devextreme-theme`.
Install and validate from this directory:

```sh
npm ci
npm run check
```

Use Node 22.12+ and npm 10+ for the development toolchain. `package-lock.json`
pins this project's dependencies; no sibling project or npm workspace is
required. `npm test` runs the same checks: token unit tests, one build (including
TypeScript checking), the tarball allowlist check, and installed-tarball integration tests
(Node and Vite). `npm run typecheck`, `npm run pack:check`, and
`npm run test:package` remain available for focused validation.

Source layout:

```text
src/       CSS, semantic tokens and TypeScript API
assets/    Canonical logo, favicon and corporate fonts
theme/     ThemeBuilder metadata
scripts/   Build, synchronization, package validation and integration tests
dist/      Generated runtime package (ignored by Git)
```

The reference application lives in the separate `smbc-style` project. To test a
release in another application, run `npm pack` here and install the resulting
`smbc-devextreme-theme-0.1.0.tgz` there.

```text
tokens.css → metadata synchronization → DevExtreme ThemeBuilder
           → generated dx.smbc.css → corporate overrides
```

**Never manually edit `src/dx.smbc.css`.** Commit the regenerated CSS and metadata.
The synchronization script generates all metadata items from the token mapping,
resolves token aliases, and rejects missing or cyclic references.
`theme/smbc-theme.metadata.json` sets package-relative icon URLs;
the build copies DevExtreme's matching Fluent icon fonts alongside corporate
assets. No paths depend on the consuming application's `node_modules` layout.

`prepack` rebuilds the package. The tarball allowlist contains only `dist`, this
README and package metadata; it excludes the demo, source and build scripts.
CSS is declared side-effectful so bundlers retain CSS-only imports.

## Corporate assets and licensing

Canonical logo, favicon and the four corporate fonts live in `assets/`. Do not
redraw them or create application-owned duplicates unless a deployment requires
build-time copies. No external font service is used.

Bundled corporate fonts and brand assets are for **approved internal SMBC use
only**. This is an UNLICENSED internal package, intended for an approved internal
registry such as Nexus. DevExtreme and its bundled icon fonts remain subject to
DevExpress licensing; consumers must hold the necessary rights.

Publication defaults to `access: restricted`, following
[npm publish configuration](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#publishconfig).
No registry URL or credentials are committed. The source publication hook rejects
the public npm registry. Configure `@smbc:registry` for the approved destination
and publish from this package directory. Do not override access to public,
disable lifecycle scripts, or publish a tarball directly: those bypass the source
hook. Registry ACLs must also restrict publication. Creating or building this project does not publish the package.
