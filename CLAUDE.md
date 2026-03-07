# Liquid Glass Blocks — CLAUDE.md

## What This Plugin Does

Adds liquid glass / glassmorphism effects to WordPress core blocks via block filters. No custom blocks. The user enables the effect from a "Liquid Glass" panel in the block sidebar, picks a preset, and adjusts controls. CSS does the rendering work.

---

## Non-Negotiable Principles

### Extend, never replace
This plugin extends core WordPress blocks only. Nothing appears in the block inserter. No custom blocks are registered. All functionality is delivered via `addFilter`.

### WordPress core fidelity
Every UI control uses the canonical `@wordpress/components` equivalent — no custom-built alternatives. Colors use `ColorPalette` with `useSetting('color.palette')` to pull the active theme palette, exactly as core blocks do. The plugin should feel like it shipped with WordPress, not like a third-party add-on.

### No JavaScript on the frontend
React and JSX are editor-only. The frontend renders via CSS custom properties and data attributes alone. No `wp-element` dependency in public-facing assets.

### CSS custom properties carry all values
PHP never writes inline CSS rules. It writes CSS custom properties only (e.g. `--lgl-blur: 16px`). The stylesheet consumes them.

---

## Architectural Decisions

### `render_block` is the injection point
Saved block attributes are read in PHP at render time. The `render_block` filter injects `data-lgl-effect="[preset-slug]"` and an inline `style` with CSS custom properties onto the block's outer wrapper. Never use a `save()` function to bake in markup — that causes block validation errors and is the wrong pattern for an extension plugin.

### `enqueue_block_assets` for CSS — not `enqueue_block_editor_assets`
WordPress 6.9+ runs the editor in an iframe. `enqueue_block_editor_assets` delivers to the parent frame and misses the canvas. `enqueue_block_assets` delivers to both editor canvas and frontend. Use it for the stylesheet. The editor and frontend share one CSS file.

### Conditional frontend loading
The frontend stylesheet is only enqueued when a supported block is present. Use `has_block()` to detect this.

---

## Prefixes — Use Consistently

- PHP functions/constants/globals: `lgl_`
- CSS classes and custom properties: `.lgl-` / `--lgl-`
- JS filter namespaces: `liquid-glass-blocks/`
- JS/block attribute names: `liquidGlassBlocks` prefix (camelCase)

---

## Supported Blocks — Phase 1

```
core/group
core/cover
core/button  ← individual button only, NOT core/buttons container
```

Block names live in a single `LGL_SUPPORTED_BLOCKS` constant. Never hardcode a block name anywhere else in the codebase.

---

## Six Presets

Slugs: `heavy-frost`, `soft-mist`, `glass-frost`, `light-frost`, `grain-frost`, `fine-frost`

Each preset is a named set of default attribute values. Selecting a preset populates all controls with those defaults; the user then adjusts individually.

Conditional controls based on active preset:
- Saturation slider → `glass-frost` only
- Noise controls → `grain-frost` and `fine-frost` only

Always-visible controls (all presets):
- Border Width (0–3px, hardcoded white at `rgba(255,255,255,0.3)`)
- Border Radius
- Shadow toggle (enables/disables outer depth shadow + inset highlight)

---

## Noise Layer (Grain Frost, Fine Frost)

The noise texture is an SVG `feTurbulence` data URI computed from the `liquidGlassBlocksNoiseIntensity` and `liquidGlassBlocksNoiseScale` attributes. Compute it in both places:

- **JS:** built into the editor wrapperProps style as `--lgl-noise-url`
- **PHP:** reconstructed from the same attribute values in `render_block` as the same custom property

The CSS `::before` pseudo-element uses `--lgl-noise-url` as `background-image`. No extra DOM elements.

---

## Background Notice

When the effect is enabled, render a `Notice` (status `info`, not dismissible) in the sidebar reminding the user that the effect requires content behind the block to blur — a background image, gradient, or another element underneath.

---

## Acceptance Criteria — Phase 1

- Enable toggle on `core/group` → effect visible in editor canvas and on frontend
- All six presets render visually distinct from each other
- Selecting a preset populates sidebar controls with that preset's defaults
- Adjusting any control updates the editor preview live
- Save and reload → all settings restore correctly
- Disabling the toggle → no `data-lgl-effect`, no inline styles in rendered HTML
- Deactivating the plugin → clean HTML, zero orphaned attributes or styles
- Effect works on `core/cover` and `core/button` as well as `core/group`
- No JS errors in editor or frontend console
- Stylesheet reaches the iframed editor canvas (test in WP 6.9+)

---

## Current Task

The immediate task is a surgical rendering upgrade to add SVG-based refraction to the existing glass effect. Read `liquid-glass-svg-upgrade-brief.md` in the project root for the full brief before doing anything.
