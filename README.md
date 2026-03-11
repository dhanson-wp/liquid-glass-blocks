# Liquid Glass Blocks

Add liquid glass and glassmorphism effects to WordPress core blocks — no custom blocks, no frontend JavaScript. Enable the effect from the block sidebar, pick a preset, and adjust to taste.

### Visual

[![Liquid Glass Blocks demo](https://github.com/user-attachments/assets/8f1d3ee9-3b2b-469a-9371-f9075159f1dd)

### Features

- **Five glass presets** — Heavy Frost, Soft Mist, Light Frost, Grain Frost, Fine Frost
- **Four shadow styles** — Drop Shadow, Glow Halo, Soft Diffused, Frosted Inset
- **Works on core blocks** — Group (including Row, Stack, Grid) and Button
- **No frontend JS** — all effects are pure CSS with `backdrop-filter`, `color-mix()`, and inline SVG displacement filters
- **Live editor preview** — every control updates the effect in real time inside the block editor
- **Theme-aware colors** — color pickers pull from the active theme palette
- **Graceful degradation** — SVG displacement effects fall back to frosted blur on Firefox and Safari
- **Conditional loading** — CSS and SVG filters only load on pages that use the effect

### How it works

The plugin extends core blocks via WordPress filters — nothing appears in the block inserter. A "Liquid Glass" panel in the block sidebar lets you toggle the effect, choose a preset, and fine-tune controls like blur, brightness, accent color, shadow, and border radius.

**Tier 1 effects** (Heavy Frost, Soft Mist) use `backdrop-filter` on a `::before` pseudo-element for CSS-only frosted glass.

**Tier 2 effects** (Light Frost, Grain Frost, Fine Frost) layer SVG `feDisplacementMap` filters on top of `backdrop-filter` to create visible glass-like distortion of the content behind the block. The `color-mix()` function tints the glass with any accent color at consistent opacity.

On the frontend, PHP reads saved block attributes at render time and injects CSS classes, CSS custom properties, and a single hidden SVG element containing the displacement filter definitions. No inline CSS rules — just custom properties consumed by the stylesheet.

```css
/* What the rendered markup looks like */
<div class="wp-block-group lgl-effect-heavy-frost lgl-shadow-glow"
     style="--lgl-blur:24px; --lgl-bg:#FFFFFF1F; --lgl-border-radius:24px;">
```

### Requirements

- WordPress 6.2+
- PHP 7.4+

### Development

1. Clone the repository into your WordPress plugins directory.
2. Run `npm install` to install dependencies.
3. Run `npm start` to start the development server.
4. Activate the plugin on your local WordPress site.
5. Enable "Liquid Glass" on any supported block from the sidebar panel.

### Building

```bash
npm run build
```

### Browser Compatibility

| Browser | Tier 1 (Frost/Mist) | Tier 2 (Displacement) |
|---------|---------------------|----------------------|
| Chrome / Edge | Full support | Full support |
| Firefox | Full support | Falls back to 5px frosted blur |
| Safari | Full support | Falls back to 5px frosted blur |

### License

GPLv2 or later — see [LICENSE](https://www.gnu.org/licenses/gpl-2.0.html).
