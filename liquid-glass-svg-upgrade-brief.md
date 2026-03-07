# Claude Code Session Brief: SVG Filter Upgrade
**Plugin:** `liquid-glass-blocks`  
**Session type:** Surgical rendering upgrade — do not touch architecture  
**Objective:** Replace the current glassmorphism-only effect with a full Liquid Glass effect by adding an SVG `feDisplacementMap` refraction layer

---

## What's already working — don't touch

- Block extension architecture via `addFilter` — correct, leave it
- `add-attributes.js` / `add-wrapper-props.js` / `with-inspector-controls.js` — correct, leave them
- `render.php` / `WP_HTML_Tag_Processor` injection pattern — correct, leave it
- `enqueue_block_assets` for iframed editor CSS delivery — correct, leave it
- All attribute saving/loading — correct, leave it
- `buildCustomProperties()` in `utils.js` — correct, leave it
- The `data-lgl-effect` / CSS custom property pipeline — correct, leave it

The settings panel, attribute flow, and PHP render filter are all sound. The only problem is visual output.

---

## What's broken and why

The current `::before` pseudo-element applies `backdrop-filter: blur() saturate() brightness()`. That produces frosted glass — background content is scattered uniformly. Real glass **bends** light directionally at its edges. That directional pixel displacement — driven by an SVG `feDisplacementMap` filter — is what makes the effect read as Liquid Glass rather than frosted plastic. It's completely absent from the current implementation.

Secondary issue: the specular highlight is a single diagonal `linear-gradient`. Real glass has rim lighting that follows the element's edge geometry. This needs to be more convincing.

---

## The fix: three specific changes

### 1. Add SVG filter injection to `render.php`

The SVG filter must be **inline in the DOM** — not in a stylesheet. `backdrop-filter: url(#id)` only works when the referenced filter is in the same document. A stylesheet can't inject inline SVG.

Add a function that outputs the filter SVG once per page load (use a static `$printed` flag). Call it inside `lgl_render_block()` before returning the modified HTML, prepending it to `$block_content`.

The filter chain:

```svg
<svg aria-hidden="true" focusable="false"
     style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none">
  <defs>
    <filter id="lgl-refraction" x="-20%" y="-20%" width="140%" height="140%"
            color-interpolation-filters="sRGB">

      <!-- Step 1: Displacement noise map -->
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.008"
                    numOctaves="3" seed="2" result="noise"/>
      <feGaussianBlur in="noise" stdDeviation="3" result="smooth-noise"/>

      <!-- Step 2: Directional refraction — the core lens effect -->
      <feDisplacementMap in="SourceGraphic" in2="smooth-noise"
                         scale="30" xChannelSelector="R" yChannelSelector="G"
                         result="displaced"/>

      <!-- Step 3: Chromatic aberration — RGB channel split -->
      <feColorMatrix in="displaced" type="matrix"
                     values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                     result="r-channel"/>
      <feOffset in="r-channel" dx="2" dy="0" result="r-shifted"/>

      <feColorMatrix in="displaced" type="matrix"
                     values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                     result="g-channel"/>

      <feColorMatrix in="displaced" type="matrix"
                     values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                     result="b-channel"/>
      <feOffset in="b-channel" dx="-2" dy="0" result="b-shifted"/>

      <feBlend in="r-shifted" in2="g-channel" mode="screen" result="rg"/>
      <feBlend in="rg" in2="b-shifted" mode="screen"/>
    </filter>
  </defs>
</svg>
```

The `scale="30"` on `feDisplacementMap` controls refraction intensity. This should also be wired to the block's blur setting — stronger blur = stronger displacement makes physical sense and gives the user one lever that feels coherent.

### 2. Upgrade `liquid-glass-blocks.css` — activate the filter and improve specular

**Add the Tier 1 `@supports` block** to activate SVG refraction on Chromium:

```css
/* Tier 1: Full refraction via SVG displacement (Chromium only) */
@supports (backdrop-filter: url(#lgl-refraction)) {
  [data-lgl-effect]::before {
    backdrop-filter:
      url(#lgl-refraction)
      blur(var(--lgl-blur, 16px))
      saturate(var(--lgl-saturation, 1))
      brightness(var(--lgl-brightness, 1.1));
    -webkit-backdrop-filter:
      url(#lgl-refraction)
      blur(var(--lgl-blur, 16px))
      saturate(var(--lgl-saturation, 1))
      brightness(var(--lgl-brightness, 1.1));
  }
}
```

The existing Tier 2 `backdrop-filter` block (without the SVG reference) stays as-is — it's the Safari/Firefox fallback. The `@supports` block simply overrides it on Chromium.

**Improve the specular highlight** in the `::before` background. Replace the single diagonal gradient with a radial + linear combination that simulates rim lighting more convincingly:

```css
background:
  /* Primary specular: light entering from top-left */
  radial-gradient(
    ellipse 70% 40% at 25% 15%,
    rgba(255, 255, 255, var(--lgl-highlight, 0.3)) 0%,
    rgba(255, 255, 255, var(--lgl-highlight-end, 0.05)) 55%,
    transparent 100%
  ),
  /* Edge rim light: top and left edges catch direct light */
  linear-gradient(
    135deg,
    rgba(255, 255, 255, calc(var(--lgl-edge-light, 0.5) * 0.6)) 0%,
    transparent 30%
  ),
  /* Counter-light: subtle bottom-right bounce */
  linear-gradient(
    315deg,
    rgba(255, 255, 255, 0.03) 0%,
    transparent 35%
  ),
  /* Base tint */
  var(--lgl-bg, rgba(255, 255, 255, 0.15));
```

**Strengthen the inset box-shadow** to better simulate the Fresnel effect (light intensity increases sharply at glass edges):

```css
box-shadow:
  /* Outer border glow */
  inset 0 0 0 var(--lgl-border-width, 1px)
    rgba(255, 255, 255, var(--lgl-border-alpha, 0.4)),
  /* Top-left tight specular rim */
  inset 2px 2px 4px
    rgba(255, 255, 255, var(--lgl-edge-light, 0.5)),
  /* Top-left broad specular bloom */
  inset 8px 8px 24px
    rgba(255, 255, 255, calc(var(--lgl-edge-light, 0.5) * 0.3)),
  /* Bottom-right counter-shadow (glass depth) */
  inset -1px -1px 0
    rgba(0, 0, 0, 0.08),
  /* Inner ambient glow */
  inset 0 6px 32px
    rgba(255, 255, 255, calc(var(--lgl-inner-glow, 0.2)
      * var(--lgl-shadow-opacity, 1)));
```

### 3. Wire refraction scale to the blur attribute

In `render.php`, the `feDisplacementMap scale` attribute should scale proportionally with blur intensity. Add a new CSS custom property `--lgl-displacement` built from the blur value:

```php
// Displacement scales with blur — stronger blur = more edge refraction
$displacement = round( ( $blur / 40 ) * 45, 1 ); // max 45px at blur=40
$styles['--lgl-displacement'] = (string) $displacement;
```

Then reference it from the SVG filter via a `<feDisplacementMap scale>` that reads from a CSS custom property... except SVG filter attributes don't accept CSS custom properties directly.

**Alternative approach:** Keep `scale="30"` as a sensible static default in the SVG. The blur control already handles perceptual intensity — the refraction doesn't need to be dynamic for the MVP. Revisit in a later iteration if needed.

---

## What NOT to do

- Don't add a new block attribute for "enable refraction" — the SVG filter is always present, the `@supports` block handles progressive enhancement automatically
- Don't move the SVG filter to an external file — it must be inline in the DOM
- Don't touch any JS files — the editor rendering doesn't use `backdrop-filter: url()`, so the SVG filter only needs to be wired on the frontend via `render.php`
- Don't change preset values or add new presets in this session
- Don't change how attributes are saved or loaded

---

## Files to modify

| File | Change |
|------|--------|
| `includes/render.php` | Add `lgl_print_svg_filter()` function with static flag; call it inside `lgl_render_block()` |
| `assets/liquid-glass-blocks.css` | Add `@supports (backdrop-filter: url(#lgl-refraction))` block; upgrade specular gradients and inset shadows |

**Files to leave untouched:**
`src/index.js`, `src/filters/*`, `src/constants.js`, `src/presets.js`, `src/utils.js`, `liquid-glass-blocks.php`

---

## Acceptance criteria

1. On Chrome/Edge/Brave: background pixels visibly bend/distort at the element's edges — the characteristic lens refraction is present, not just blur
2. On Safari/Firefox: effect falls back cleanly to the existing enhanced glassmorphism — no broken layout, no console errors
3. The SVG filter SVG element appears once in the page source, immediately before the first `[data-lgl-effect]` block, not repeated per block
4. All six presets still render correctly — the refraction layer is additive, not replacing existing behavior
5. The editor preview is unaffected — the SVG filter is frontend-only via `render.php`; the editor uses the existing `add-wrapper-props.js` path which doesn't reference the SVG filter

---

## Key reference implementations

Before writing code, review these for implementation patterns:

- **wprod's CSS+SVG Music Player** — `codepen.io/wprod/pen/raVpwJL` — zero JS, 4-layer architecture closest to this plugin's pattern
- **kube.io physics-based approach** — `kube.io/blog/liquid-glass-css-svg/` — best technical breakdown of the displacement map approach
- **Atlas Pup Labs** — `atlaspuplabs.com/blog/liquid-glass-but-in-css` — Fresnel inset shadow simulation detail

---

## Context

This is a WordPress block extension plugin. It adds glassmorphism to `core/group`, `core/cover`, and `core/button` via `addFilter` without custom blocks. The effect runs entirely in CSS on the frontend — no frontend JavaScript. The SVG filter is the missing refraction layer; everything else is in place.
