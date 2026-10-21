# @smbc/devextreme-theme

SMBC adapter for DevExtreme **26.1.4**, based on `fluent.blue.light.compact`.
Version **0.2.0**. React is not required.

## Installation and usage

```sh
npm install @smbc/theme@0.1.0 @smbc/devextreme-theme@0.2.0 devextreme@26.1.4
```

```ts
import '@smbc/devextreme-theme/styles.css';
```

The aggregate imports `@smbc/theme/styles.css` (fonts and tokens), generated
DevExtreme CSS, then corporate overrides. Keep the consumer's existing CSS layer
order and `dx-viewport` container. Do not also load a stock DevExtreme theme.
The adapter owns no HTML baseline or application layout.

Exports: `/styles.css`, `/devextreme.css`, `/overrides.css`, `/viz`.
For separate CSS imports, load the base theme first, then DevExtreme and overrides.

## Migration from 0.1.0

Tokens, fonts, assets, root URL helpers and the Tailwind bridge now belong to
`@smbc/theme`. Replace their old imports with `@smbc/theme`,
`@smbc/theme/assets`, `/tokens.css`, `/fonts.css` or `/tailwind.css`.
The adapter's old root and shared-resource exports are removed without aliases.
The source directory is now `smbc-devextreme-theme`.

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

## Development

Use Node 22.12+ and npm 10+. Build and pack `../smbc-theme` first; the local
devDependency points at its archive. Then run `npm ci`, `npm run check`, and
`npm run typecheck`. `npm pack` creates `smbc-devextreme-theme-0.2.0.tgz`.

`npm run theme:build` resolves the installed package's public
`@smbc/theme/tokens.css` export, generates metadata, and builds `src/dx.smbc.css`.
No sibling source path is read. Commit regenerated metadata/CSS; never manually
edit generated CSS. The adapter contains only matching DevExtreme icon fonts;
corporate fonts and brand resources remain in the base package.

The exact base-theme peer version `0.1.0` identifies the tokens used to generate
CSS. When releasing changed base tokens, rebuild and release the adapter with
its matching peer version. The DevExtreme peer range remains `~26.1.4`.

Checks cover metadata generation and missing/cyclic tokens, archive contents,
removed exports, palette registration, installed-tarball CSS and assets under
`/nested/`. Run `npm run refresh:packages` from `../smbc-style` for the full flow.

## Publication and licensing

Internal UNLICENSED package, `access: restricted`. Configure `@smbc:registry`
for the approved internal registry. The publication hook rejects public npm;
do not bypass lifecycle scripts or publish archives directly. DevExtreme and
its icon fonts remain subject to DevExpress licensing. Building does not publish.
