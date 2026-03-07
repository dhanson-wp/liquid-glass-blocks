<?php
/**
 * Render-time block filter for Liquid Glass Blocks.
 *
 * Injects data-lgl-effect and CSS custom properties onto supported blocks
 * via WP_HTML_Tag_Processor. PHP never writes inline CSS rules — only
 * CSS custom properties.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Convert a hex colour + opacity (0-100) to an rgba() string.
 *
 * @param string     $hex     Hex colour (#ffffff or #fff).
 * @param int|float  $opacity Opacity 0-100.
 * @return string rgba() value.
 */
function lgl_hex_to_rgba( $hex, $opacity ) {
	$hex = ltrim( $hex, '#' );

	if ( strlen( $hex ) === 3 ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}

	$r = hexdec( substr( $hex, 0, 2 ) );
	$g = hexdec( substr( $hex, 2, 2 ) );
	$b = hexdec( substr( $hex, 4, 2 ) );
	$a = round( $opacity / 100, 4 );

	return sprintf( 'rgba(%d,%d,%d,%s)', $r, $g, $b, $a );
}

/**
 * Print the inline SVG refraction filter once per page load.
 *
 * The SVG filter must live in the DOM — `backdrop-filter: url(#id)` only
 * resolves when the referenced filter is in the same document. A static
 * flag ensures it's emitted exactly once, before the first glass block.
 *
 * @return string SVG markup on first call, empty string thereafter.
 */
function lgl_print_svg_filter() {
	static $printed = false;

	if ( $printed ) {
		return '';
	}

	$printed = true;

	return '<svg aria-hidden="true" focusable="false"'
		. ' style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none">'
		. '<defs>'
		. '<filter id="lgl-refraction" x="-20%" y="-20%" width="140%" height="140%"'
		. ' color-interpolation-filters="sRGB">'
		. '<feTurbulence type="fractalNoise" baseFrequency="0.006 0.008"'
		. ' numOctaves="3" seed="2" result="noise"/>'
		. '<feGaussianBlur in="noise" stdDeviation="3" result="smooth-noise"/>'
		. '<feDisplacementMap in="SourceGraphic" in2="smooth-noise"'
		. ' scale="30" xChannelSelector="R" yChannelSelector="G"'
		. ' result="displaced"/>'
		. '<feColorMatrix in="displaced" type="matrix"'
		. ' values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"'
		. ' result="r-channel"/>'
		. '<feOffset in="r-channel" dx="2" dy="0" result="r-shifted"/>'
		. '<feColorMatrix in="displaced" type="matrix"'
		. ' values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"'
		. ' result="g-channel"/>'
		. '<feColorMatrix in="displaced" type="matrix"'
		. ' values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"'
		. ' result="b-channel"/>'
		. '<feOffset in="b-channel" dx="-2" dy="0" result="b-shifted"/>'
		. '<feBlend in="r-shifted" in2="g-channel" mode="screen" result="rg"/>'
		. '<feBlend in="rg" in2="b-shifted" mode="screen"/>'
		. '</filter>'
		. '<filter id="lgl-noise-grain" x="0%" y="0%" width="100%" height="100%"'
		. ' color-interpolation-filters="sRGB">'
		. '<feTurbulence type="fractalNoise" baseFrequency="0.65"'
		. ' numOctaves="4" stitchTiles="stitch"/>'
		. '<feColorMatrix type="saturate" values="0"/>'
		. '</filter>'
		. '<filter id="lgl-noise-fine" x="0%" y="0%" width="100%" height="100%"'
		. ' color-interpolation-filters="sRGB">'
		. '<feTurbulence type="fractalNoise" baseFrequency="1.2"'
		. ' numOctaves="4" stitchTiles="stitch"/>'
		. '<feColorMatrix type="saturate" values="0"/>'
		. '</filter>'
		. '</defs>'
		. '</svg>';
}

/**
 * Render block filter — injects Liquid Glass data attributes and
 * CSS custom properties onto supported blocks.
 *
 * @param string $block_content Rendered block HTML.
 * @param array  $block         Block data including attrs.
 * @return string Modified HTML.
 */
function lgl_render_block( $block_content, $block ) {
	if ( ! in_array( $block['blockName'], LGL_SUPPORTED_BLOCKS, true ) ) {
		return $block_content;
	}

	$attrs = $block['attrs'] ?? array();

	if ( empty( $attrs['liquidGlassBlocksEnabled'] ) ) {
		return $block_content;
	}

	$preset = $attrs['liquidGlassBlocksPreset'] ?? 'heavy-frost';

	// Read attribute values with defaults matching the heavy-frost preset.
	$blur            = $attrs['liquidGlassBlocksBlur'] ?? 28;
	$tint_color      = $attrs['liquidGlassBlocksTintColor'] ?? '#ffffff';
	$tint_opacity    = $attrs['liquidGlassBlocksTintOpacity'] ?? 30;
	$saturation      = $attrs['liquidGlassBlocksSaturation'] ?? 1;
	$border_width    = $attrs['liquidGlassBlocksBorderWidth'] ?? 1;
	$border_radius   = $attrs['liquidGlassBlocksBorderRadius'] ?? 0;
	$shadow          = $attrs['liquidGlassBlocksShadow'] ?? true;
	$noise_intensity = $attrs['liquidGlassBlocksNoiseIntensity'] ?? 50;

	// Build CSS custom properties.
	$styles = array(
		'--lgl-blur'           => $blur . 'px',
		'--lgl-bg'             => lgl_hex_to_rgba( $tint_color, $tint_opacity ),
		'--lgl-saturation'     => (string) $saturation,
		'--lgl-border-width'   => $border_width . 'px',
		'--lgl-border-radius'  => $border_radius . 'px',
		'--lgl-shadow-opacity' => $shadow ? '1' : '0',
	);

	if ( in_array( $preset, array( 'grain-frost', 'fine-frost' ), true ) ) {
		$styles['--lgl-noise-opacity'] = (string) round( $noise_intensity / 100, 4 );
	}

	$style_parts = array();
	foreach ( $styles as $prop => $value ) {
		$style_parts[] = $prop . ':' . $value;
	}
	$style_string = implode( ';', $style_parts );

	$processor = new WP_HTML_Tag_Processor( $block_content );

	if ( $processor->next_tag() ) {
		$processor->set_attribute( 'data-lgl-effect', $preset );

		// Merge with any existing inline style.
		$existing = $processor->get_attribute( 'style' );
		$merged   = $existing ? rtrim( $existing, '; ' ) . ';' . $style_string : $style_string;

		$processor->set_attribute( 'style', $merged );
	}

	return lgl_print_svg_filter() . $processor->get_updated_html();
}
add_filter( 'render_block', 'lgl_render_block', 10, 2 );
