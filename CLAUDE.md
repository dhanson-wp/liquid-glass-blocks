# Liquid Glass Blocks — CLAUDE.md

## What This Plugin Does

Adds liquid glass / glassmorphism effects to WordPress core blocks via block filters. No custom blocks — the user enables the effect from a "Liquid Glass" panel in the block sidebar, picks an effect preset, and adjusts controls. CSS `backdrop-filter`, `color-mix()`, and inline SVG `feDisplacementMap` filters do the rendering.

---

## Non-Negotiable Principles

### Extend, never replace
This plugin extends core WordPress blocks only. Nothing appears in the block inserter. No custom blocks are registered. All functionality is delivered via `addFilter` (editor) and `render_block` (frontend).

### WordPress core fidelity
Every UI control uses the canonical `@wordpress/components` equivalent — no custom-built alternatives. Colors use `ColorPalette` with `useSetting('color.palette')` to pull the active theme palette. The plugin should feel like it shipped with WordPress.

### No JavaScript on the frontend
React and JSX are editor-only. The frontend renders via CSS classes, CSS custom properties, data attributes, and inline SVG filters. No `wp-element` dependency in public-facing assets.

### CSS custom properties carry all values
PHP never writes inline CSS rules. It writes CSS custom properties only (e.g. `--lgl-blur: 24px`). The stylesheet consumes them. One exception: the SVG `filter: url(#id)` reference on `::before` which is set by CSS class, not custom property.

---

## Architectural Decisions

### `render_block` is the injection point
Saved block attributes are read in PHP at render time. The `render_block` filter adds CSS classes (`lgl-effect-{slug}`, `lgl-shadow-{slug}`), an inline `style` attribute with CSS custom properties, and the `--lgl-accent` custom property onto the block's outer wrapper. Never use a `save()` function to bake markup — that causes block validation errors.

### SVG filters are injected once per page
PHP prints a hidden `<svg>` element containing all three displacement filter definitions via `wp_footer`. A static flag prevents duplicate injection. In the editor, a React `useEffect` injects the same SVG into the editor iframe's document body once.

### `::before` pseudo-element is the glass layer
The glass effect renders on a `::before` pseudo-element positioned absolutely over the block. This isolates the visual effect from block content. The parent block gets `overflow: hidden` and `transform: translateZ(0)` for GPU compositing and clipping.

### Why `backdrop-filter` is required on tier 2 `::before` (the displacement trick)
An empty pseudo-element (`content: ""`) has no painted content. Applying `filter: url(#svg-displacement)` to it would displace nothing — the element is invisible. The critical trick: **`backdrop-filter: blur(5px)` on the `::before` captures the backdrop content into the pseudo-element's compositing layer**. In Chromium's rendering pipeline:
1. `backdrop-filter` renders the content behind `::before` onto its compositing layer (with a 5px blur)
2. `filter: url(#displacement)` then processes that composited layer through the SVG displacement map
3. The result is distorted backdrop content visible through the pseudo-element

Without `backdrop-filter`, the SVG filter has no source pixels to displace. Setting `backdrop-filter: blur(0px)` captures the backdrop but produces no visible rendering — the displacement still displaces "nothing." A real blur value (≥1px) is required to make the captured backdrop visible so the displacement has content to warp.

This is a **Chromium-only rendering behavior**. Firefox and Safari do not compose SVG displacement filters onto backdrop-filter content. Those browsers get the `backdrop-filter: blur(5px)` as a graceful fallback (frosted glass without distortion).

### `enqueue_block_assets` for CSS — not `enqueue_block_editor_assets`
WordPress 6.9+ runs the editor in an iframe. `enqueue_block_editor_assets` delivers to the parent frame and misses the canvas. `enqueue_block_assets` delivers to both editor canvas and frontend. The editor and frontend share one CSS file.

### Conditional frontend loading
The frontend stylesheet and SVG filters are only enqueued when a supported block with glass enabled is present. Use `has_block()` to detect this.

---

## Prefixes — Use Consistently

- PHP functions/constants/globals: `lgl_`
- CSS classes: `.lgl-effect-{slug}`, `.lgl-shadow-{slug}`
- CSS custom properties: `--lgl-blur`, `--lgl-bg`, `--lgl-brightness`, `--lgl-accent`, `--lgl-border-radius`
- JS filter namespaces: `liquid-glass-blocks/`
- JS/block attribute names: `liquidGlass` object attribute (contains `enable`, `effect`, `backgroundColor`, `backdropFilter`, `brightness`, `shadowEffect`)

---

## Supported Blocks

```
core/group       ← includes Row, Stack, and Grid variations
core/cover
core/button      ← individual button only, NOT core/buttons container
```

Block names live in a single `LGL_SUPPORTED_BLOCKS` constant. Never hardcode a block name anywhere else. The `core/group` entry covers all Group block variations (Group, Row, Stack, Grid) because they share the same block name.

---

## Five Effect Presets

Effects split into two rendering tiers:

### Tier 1: CSS-only effects (backdrop-filter on `::before`)

| Slug | Name | Technique | Defaults |
|------|------|-----------|----------|
| `heavy-frost` | Heavy Frost | `backdrop-filter: blur(var(--lgl-blur))` | `--lgl-blur: 24px`, `--lgl-bg: rgba(255,255,255,0.12)`, border-radius: 24px |
| `soft-mist` | Soft Mist | `backdrop-filter: blur(var(--lgl-blur)) brightness(var(--lgl-brightness))` | `--lgl-blur: 20px`, `--lgl-bg: rgba(117,59,59,0.12)`, `--lgl-brightness: 1`, border-radius: 24px |

### Tier 2: SVG displacement effects (filter on `::before`)

| Slug | Name | SVG Filter ID | Defaults |
|------|------|---------------|----------|
| `light-frost` | Light Frost | `#lgl-distortion-light` | `--lgl-accent: currentColor`, border-radius: 24px |
| `grain-frost` | Grain Frost | `#lgl-distortion-grain` | `--lgl-accent: currentColor`, border-radius: 24px |
| `fine-frost` | Fine Frost | `#lgl-distortion-fine` | `--lgl-accent: currentColor`, border-radius: 24px |

Selecting a preset populates all controls with its defaults; the user then adjusts individually.

---

## CSS Architecture Per Tier

### Tier 1 (CSS-only): `.lgl-effect-heavy-frost`, `.lgl-effect-soft-mist`

```css
.lgl-effect-heavy-frost,
.lgl-effect-soft-mist {
    position: relative;
    overflow: hidden;
    border-radius: var(--lgl-border-radius, 24px);
    transform: translateZ(0);    /* GPU compositing layer */
}

.lgl-effect-heavy-frost::before,
.lgl-effect-soft-mist::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--lgl-bg);
    -webkit-backdrop-filter: blur(var(--lgl-blur));
    backdrop-filter: blur(var(--lgl-blur));
    transform: translateZ(0);
}

/* soft-mist adds brightness */
.lgl-effect-soft-mist::before {
    -webkit-backdrop-filter: blur(var(--lgl-blur)) brightness(var(--lgl-brightness, 1));
    backdrop-filter: blur(var(--lgl-blur)) brightness(var(--lgl-brightness, 1));
}
```

### Tier 2 (SVG displacement): `.lgl-effect-light-frost`, `.lgl-effect-grain-frost`, `.lgl-effect-fine-frost`

```css
.lgl-effect-light-frost,
.lgl-effect-grain-frost,
.lgl-effect-fine-frost {
    position: relative;
    overflow: hidden;
    border: solid 1px color-mix(in srgb, var(--lgl-accent) 30%, transparent);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    background: color-mix(in srgb, var(--lgl-accent) 7.5%, transparent);
    border-radius: var(--lgl-border-radius, 24px);
    transform: translateZ(0);
}

.lgl-effect-light-frost::before,
.lgl-effect-grain-frost::before,
.lgl-effect-fine-frost::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    /* CRITICAL: backdrop-filter captures the backdrop into this layer.
       The blur makes the captured content visible so the SVG filter
       has actual pixels to displace. blur(0px) produces nothing. */
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    transform: translateZ(0);
}

/* Each variant references its own SVG filter, which displaces
   the backdrop content captured by backdrop-filter above */
.lgl-effect-light-frost::before  { filter: url(#lgl-distortion-light); }
.lgl-effect-grain-frost::before  { filter: url(#lgl-distortion-grain); }
.lgl-effect-fine-frost::before   { filter: url(#lgl-distortion-fine); }
```

### Key technique: `color-mix()`
Distortion effects use `color-mix(in srgb, var(--lgl-accent) N%, transparent)` for both background tint and border color. This lets the user pick any accent color and have it applied at consistent opacity without separate opacity controls. The `--lgl-accent` custom property defaults to `currentColor` and is overridable via the color picker.

### Graceful degradation on non-Chromium browsers
Since `::before` already has `backdrop-filter: blur(5px)`, browsers that don't support SVG displacement on backdrop content (Firefox, Safari) automatically get a frosted glass effect. The `filter: url(#id)` simply has no visible effect on those browsers — the displacement is silently ignored, and the 5px blur shows through as a clean frost. No `@supports` fallback is needed because the baseline `backdrop-filter` already provides a good visual.

---

## SVG Displacement Filters

Three `<filter>` elements inside a single hidden `<svg>` element, injected once per page (PHP `wp_footer`) and once in the editor (JS `useEffect`):

### `#lgl-distortion-light` — Smooth rippled glass
```xml
<filter id="lgl-distortion-light" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.02" numOctaves="2" seed="92" result="noise" />
    <feGaussianBlur in="noise" stdDeviation="0.02" result="smooth" />
    <feDisplacementMap in="SourceGraphic" in2="smooth" scale="30" xChannelSelector="R" yChannelSelector="G" />
</filter>
```
Character: fractalNoise with 2 octaves produces smooth, organic undulations. The very low blur stdDeviation (0.02) preserves the fine noise structure. Result looks like looking through rippled shower glass.

### `#lgl-distortion-grain` — Textured frosted glass
```xml
<filter id="lgl-distortion-grain" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.02" numOctaves="1" seed="9000" result="noise" />
    <feGaussianBlur in="noise" stdDeviation="0.1" result="smooth" />
    <feDisplacementMap in="SourceGraphic" in2="smooth" scale="30" xChannelSelector="R" yChannelSelector="G" />
</filter>
```
Character: Single octave fractalNoise creates broader, simpler displacement patterns. The slightly higher blur (0.1) softens the noise edges. Different seed (9000) produces a distinct pattern from light-frost. Result looks like pebbled/textured glass.

### `#lgl-distortion-fine` — Soft fine warp
```xml
<filter id="lgl-distortion-fine">
    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G" />
</filter>
```
Character: Uses `turbulence` type (not fractalNoise) — produces sharper, more angular distortion. Three octaves add fine detail. No intermediate blur step — raw turbulence feeds directly into displacement for maximum crispness. Result is a refined, detailed warp.

### How the three distortion presets differ
All three share `baseFrequency="0.02"` and `scale="30"` — the visual distinction comes from:
- **Turbulence type**: `fractalNoise` (light, grain) vs `turbulence` (fine) — fractalNoise produces smoother, cloudlike patterns; turbulence produces sharper, more structured patterns
- **Octave count**: 1 (grain) vs 2 (light) vs 3 (fine) — more octaves = more fine detail layered in
- **Blur step**: 0.02 (light) vs 0.1 (grain) vs none (fine) — blur smooths the noise map before displacement; no blur = sharper distortion
- **Seed**: Different seeds (92, 9000, default) ensure each filter produces a visually distinct pattern

### SVG rendering rules:
- The `<svg>` wrapper is `width="0" height="0"` with `position: absolute` — zero visual footprint
- Use a static flag (`$svg_rendered`) to prevent duplicate injection across multiple blocks
- Each filter uses a different `seed` value for visual variety
- Filter region attributes (`x="0%" y="0%" width="100%" height="100%"`) ensure the filter covers the full element — without these, default SVG filter regions may clip the displacement at edges
- In the editor, inject into the iframe document body via `useEffect` with cleanup on unmount
- All blocks on a page share the same three global filter IDs — SVG filters are stateless so no per-block scoping is needed

---

## Four Shadow Styles

Shadows are independent of the glass effect. Applied via a separate CSS class `.lgl-shadow-{slug}`:

| Slug | Name | CSS | Border Radius Default |
|------|------|-----|----------------------|
| `drop` | Drop Shadow | `box-shadow: -1px 9px 28px 2px rgba(0,0,0,0.78)` | 24px |
| `glow` | Glow Halo | `box-shadow: 0 0 8px 1px rgb(165 165 165 / 78%)` | 16px |
| `soft` | Soft Diffused | `box-shadow: 1px 1px 60px 0 #bebebe` | 8px |
| `frosted` | Frosted Inset | Multi-layer inset: `inset 10px 10px 20px rgba(153,192,255,0.1), inset 2px 2px 5px rgba(195,218,255,0.2), inset -10px -10px 20px rgba(229,253,190,0.1), inset -2px -2px 30px rgba(247,255,226,0.2)` + `border: 2px solid rgb(206,206,206)` | 24px |

Shadow selection of `none` → no shadow class applied.

---

## Block Attribute Schema

All glass settings live in a single `liquidGlass` object attribute on the block:

```json
{
    "liquidGlass": {
        "type": "object",
        "default": {
            "enable": false,
            "effect": "heavy-frost",
            "backgroundColor": "#FFFFFF1F",
            "backdropFilter": 24,
            "brightness": 1,
            "shadowEffect": "none",
            "accent": ""
        }
    }
}
```

Additional attributes for border radius live alongside the object (using the WordPress `BorderRadiusControl` pattern or individual dimension attributes).

---

## Sidebar Controls

All controls appear inside a "Liquid Glass" `PanelBody` in the block inspector, gated behind the `enable` toggle.

### Always visible (when enabled):
1. **Recommendation Notice** — `Notice` (status `info`, not dismissible): "Use Liquid Glass inside a wrapper with a background image. Make the block background transparent and adjust padding as needed."
2. **Preset Selector** — `SelectControl` with five options mapping to effect slugs
3. **Shadow Effects** — `SelectControl` with None + four shadow options
4. **Border Radius** — Linked dimension control (syncs all corners by default)

### Conditional on active preset:
- **Background Color** → `heavy-frost` and `soft-mist` only (tier 1). `ColorPalette` with theme colors.
- **Backdrop Filter (blur)** → `heavy-frost` and `soft-mist` only. `RangeControl`, min 0, max 50, step 1.
- **Brightness** → `soft-mist` only. `RangeControl`, min 0, max 5, step 0.1.
- **Accent Color** → `light-frost`, `grain-frost`, `fine-frost` only (tier 2). `ColorPalette` with theme colors. Controls `--lgl-accent` for `color-mix()` tinting and border.

---

## Preset Default Values

When the user selects a preset, all controls reset to these values:

| Preset | backgroundColor | backdropFilter | brightness | accent | borderRadius |
|--------|----------------|----------------|------------|--------|-------------|
| `heavy-frost` | `#FFFFFF1F` | 24 | 1 | — | 24px |
| `soft-mist` | `#753B3B1F` | 20 | 1 | — | 24px |
| `light-frost` | — | — | — | `currentColor` | 24px |
| `grain-frost` | — | — | — | `currentColor` | 24px |
| `fine-frost` | — | — | — | `currentColor` | 24px |

---

## PHP Rendering (`render_block` filter)

```
1. Check block name is in LGL_SUPPORTED_BLOCKS
2. Check liquidGlass.enable === true
3. Build CSS class string: "lgl-effect-{effect}" + "lgl-shadow-{shadowEffect}"
4. Build inline style string with CSS custom properties:
   - Tier 1: --lgl-blur, --lgl-bg, --lgl-brightness, --lgl-border-radius
   - Tier 2: --lgl-accent, --lgl-border-radius
5. Inject classes and style onto the block's outer wrapper element via HTML string manipulation
6. If any glass block is present, set flag to inject SVG filters in wp_footer
```

---

## Editor JS Architecture

### File structure:
```
src/
  index.js              ← Entry: registers all filters
  filters/
    add-attributes.js   ← addFilter('blocks.registerBlockType') — adds liquidGlass attribute
    add-inspector.js    ← addFilter('editor.BlockEdit') — renders sidebar panel
    add-wrapper-props.js← addFilter('editor.BlockListBlock') — adds classes + styles + SVG injection
  constants.js          ← LGL_SUPPORTED_BLOCKS, effect definitions, shadow definitions, defaults
```

### `add-wrapper-props.js` responsibilities:
- Adds `lgl-effect-{slug}` and `lgl-shadow-{slug}` classes to the block wrapper
- Sets CSS custom properties as inline styles for live preview
- Injects the SVG filter definitions into the editor iframe document body (once, via `useEffect` with a DOM check for existing element)

### `add-inspector.js` responsibilities:
- Renders `PanelBody` titled "Liquid Glass" with `ToggleControl` for enable
- When enabled: shows Notice, preset selector, conditional controls, shadow selector, border radius
- Preset selection triggers a batch `setAttributes` that resets all values to preset defaults

---

## GPU Compositing — Critical Detail

Both the block element and its `::before` pseudo-element need `transform: translateZ(0)`. This:
- Forces GPU compositing layers for smooth `backdrop-filter` rendering
- Prevents paint artifacts on scroll
- Ensures the SVG filter renders in its own compositing context

Without this, `backdrop-filter` may fail to render or cause visual glitches in some browsers.

---

## Browser Compatibility

- **Chrome/Edge**: Full support for all effects. SVG `filter: url(#id)` composes with `backdrop-filter` on the `::before` to produce visible distortion of backdrop content.
- **Firefox**: `backdrop-filter: blur(5px)` works on `::before`, producing a frosted glass effect. SVG displacement on backdrop content is silently ignored — tier 2 effects degrade to a 5px frosted blur.
- **Safari**: `backdrop-filter` works with `-webkit-` prefix. SVG displacement on backdrop not supported — same graceful degradation as Firefox.

No `@supports` fallback needed: the `backdrop-filter: blur(5px)` on tier 2 `::before` already provides a clean frost on all browsers. The SVG displacement is a progressive enhancement visible only in Chromium.

---

## Known Pitfalls (from prior implementation)

### Noise/texture must tile, not radiate from a corner
If noise is generated as a fixed-size background image (e.g. inline SVG data URI), the filter origin lands in the top-left corner and creates a dark vignette artifact. Fix: either use a small tile (50–80px) with `background-repeat: repeat`, or move noise to a `::after` pseudo-element driven by an SVG filter defined in the stylesheet. The SVG filter approach (which we use) avoids this entirely because `feTurbulence` generates procedural noise that fills the element.

### Tint color must be white-based for frost effects
Tier 1 effects need white-based tinting — `rgba(255,255,255, N)` — not dark colors. Dark tint makes the glass look like a dark overlay rather than frosted glass. The `#FFFFFF1F` default for heavy-frost is intentional (white at ~12% opacity). Soft-mist uses a warm tint (`#753B3B1F`) for variety.

### Blur values must be aggressively separated
All five effects must look visually distinct at a glance. If blur values are too similar, the presets feel interchangeable. Heavy Frost at 24px and Soft Mist at 20px may need further separation during testing.

### SVG displacement needs real backdrop-filter blur — not blur(0px)
The `::before` pseudo-element has no painted content of its own (`content: ""`). If you set `backdrop-filter: blur(0px)`, the backdrop is technically "captured" but produces no visible rendering. The SVG `filter: url()` then displaces an invisible layer — nothing appears. **You must use a real blur value** (e.g. `blur(5px)`) so the captured backdrop is actually rendered, giving the displacement map pixels to warp. This was the root cause of our previous failed build.

### Edge glow comes from inset box-shadow, not border alone
A plain `border: 1px solid white` looks flat. The "frosted" shadow style achieves edge glow via multi-layer `box-shadow: inset` with colored translucent glows. For tier 2 effects, `color-mix()` on the border provides a similar luminous edge feel.

---

## Acceptance Criteria

- Enable toggle on `core/group` → effect visible in editor canvas and on frontend
- All five effects render visually distinct from each other
- Tier 1 effects show backdrop blur through the `::before` layer
- Tier 2 effects show visible background distortion/warping (not just blur)
- Selecting a preset populates sidebar controls with that preset's defaults
- Adjusting any control updates the editor preview live
- Conditional controls: blur/bg color show only for tier 1; accent color shows only for tier 2; brightness only for soft-mist
- Shadow: all 4 styles render distinctly; "none" removes shadow class
- Save and reload → all settings restore correctly
- Disabling the toggle → no glass classes, no inline styles in rendered HTML
- Deactivating the plugin → clean HTML, zero orphaned attributes or styles
- Effect works on `core/group` (all variations: Group, Row, Stack, Grid), `core/cover`, and `core/button`
- Frontend: CSS classes + CSS vars in source; SVG filters appear once in footer
- `transform: translateZ(0)` present on both block and `::before` for GPU compositing
- `color-mix()` tinting works with user-selected accent colors on tier 2 effects
- No JS errors in editor or frontend console
- Stylesheet reaches the iframed editor canvas (test in WP 6.9+)
- SVG filter `<svg>` has zero visual footprint (`width="0" height="0"`)
- Fallback: tier 2 effects degrade gracefully to `backdrop-filter: blur(5px)` frosted glass on Firefox/Safari (no `@supports` needed)
- Tier 2 `::before` uses `backdrop-filter: blur(5px)` (NOT `blur(0px)`) — required for SVG displacement to have source pixels
