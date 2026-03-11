<?php
/**
 * Frontend rendering: render_block filter and per-block SVG filter injection.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tier 1 effects (CSS-only backdrop-filter).
 */
define( 'LGL_TIER1_EFFECTS', array( 'heavy-frost', 'soft-mist' ) );

/**
 * Tier 2 effects (SVG displacement).
 */
define( 'LGL_TIER2_EFFECTS', array( 'light-frost', 'grain-frost', 'fine-frost' ) );

/**
 * Per-preset SVG filter configuration: noise type and seed.
 * Numeric parameters (scale, frequency, octaves, smoothing) come from block attributes.
 */
define( 'LGL_TIER2_FILTER_CONFIG', array(
	'light-frost' => array( 'noiseType' => 'fractalNoise', 'seed' => 92 ),
	'grain-frost' => array( 'noiseType' => 'fractalNoise', 'seed' => 9000 ),
	'fine-frost'  => array( 'noiseType' => 'turbulence',   'seed' => 0 ),
) );

/**
 * Build an SVG string containing a single <filter> element for a tier 2 block.
 *
 * @param string $filter_id Unique filter ID.
 * @param string $effect    The active tier 2 effect slug.
 * @param array  $attrs     Block attributes (liquidGlass object).
 * @return string SVG markup.
 */
function lgl_build_filter_svg( $filter_id, $effect, $attrs ) {
	$config = LGL_TIER2_FILTER_CONFIG[ $effect ] ?? null;
	if ( ! $config ) {
		return '';
	}

	$noise_type = $config['noiseType'];
	$seed       = (int) $config['seed'];
	$scale      = isset( $attrs['distortionScale'] ) ? (float) $attrs['distortionScale'] : 30;
	$freq       = isset( $attrs['noiseFrequency'] ) ? (float) $attrs['noiseFrequency'] : 0.02;
	$octaves    = isset( $attrs['noiseOctaves'] ) ? (int) $attrs['noiseOctaves'] : 2;
	$smoothing  = isset( $attrs['noiseSmoothing'] ) ? (float) $attrs['noiseSmoothing'] : 0;

	$seed_attr = $seed ? ' seed="' . $seed . '"' : '';
	$freq_str  = $freq . ' ' . $freq;

	$inner = '<feTurbulence type="' . esc_attr( $noise_type ) . '" baseFrequency="' . esc_attr( $freq_str ) . '" numOctaves="' . (int) $octaves . '"' . $seed_attr . ' result="noise"/>';

	if ( $smoothing > 0 ) {
		$inner .= '<feGaussianBlur in="noise" stdDeviation="' . esc_attr( $smoothing ) . '" result="smooth"/>';
		$inner .= '<feDisplacementMap in="SourceGraphic" in2="smooth" scale="' . esc_attr( $scale ) . '" xChannelSelector="R" yChannelSelector="G"/>';
	} else {
		$inner .= '<feDisplacementMap in="SourceGraphic" in2="noise" scale="' . esc_attr( $scale ) . '" xChannelSelector="R" yChannelSelector="G"/>';
	}

	return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute"><defs>'
		. '<filter id="' . esc_attr( $filter_id ) . '" x="0%" y="0%" width="100%" height="100%">'
		. $inner
		. '</filter></defs></svg>';
}

/**
 * Modify rendered block HTML to inject liquid glass classes and CSS custom properties.
 *
 * @param string $block_content The block HTML.
 * @param array  $block         The parsed block data.
 * @return string Modified block HTML.
 */
function lgl_render_block( $block_content, $block ) {
	if ( ! in_array( $block['blockName'], LGL_SUPPORTED_BLOCKS, true ) ) {
		return $block_content;
	}

	$attrs = $block['attrs']['liquidGlass'] ?? array();

	if ( empty( $attrs['enable'] ) ) {
		return $block_content;
	}

	// Set global flag for conditional asset loading.
	$GLOBALS['lgl_has_glass'] = true;

	$effect       = $attrs['effect'] ?? 'heavy-frost';
	$shadow       = $attrs['shadowEffect'] ?? 'none';
	$is_tier1     = in_array( $effect, LGL_TIER1_EFFECTS, true );
	$is_tier2     = in_array( $effect, LGL_TIER2_EFFECTS, true );

	// Build CSS classes.
	$classes = 'lgl-effect-' . sanitize_html_class( $effect );
	if ( 'none' !== $shadow ) {
		$classes .= ' lgl-shadow-' . sanitize_html_class( $shadow );
	}

	// Build CSS custom properties.
	$custom_props = array();

	if ( $is_tier1 ) {
		$blur = isset( $attrs['backdropFilter'] ) ? (int) $attrs['backdropFilter'] : 24;
		$custom_props[] = '--lgl-blur:' . $blur . 'px';

		if ( ! empty( $attrs['backgroundColor'] ) ) {
			$custom_props[] = '--lgl-bg:' . sanitize_hex_color_with_alpha( $attrs['backgroundColor'] );
		}

		if ( 'soft-mist' === $effect && isset( $attrs['brightness'] ) ) {
			$custom_props[] = '--lgl-brightness:' . (float) $attrs['brightness'];
		}
	}

	if ( $is_tier2 ) {
		// Accent color.
		if ( ! empty( $attrs['accent'] ) ) {
			$custom_props[] = '--lgl-accent:' . sanitize_hex_color_with_alpha( $attrs['accent'] );
		}

		// Per-block SVG filter reference.
		static $filter_counter = 0;
		$filter_counter++;
		$filter_id = 'lgl-filter-' . $filter_counter;

		$custom_props[] = '--lgl-filter:url(#' . esc_attr( $filter_id ) . ')';

		// Tier 2 backdrop blur.
		$tier2_blur = isset( $attrs['tier2Blur'] ) ? max( 1, (int) $attrs['tier2Blur'] ) : 5;
		$custom_props[] = '--lgl-tier2-blur:' . $tier2_blur . 'px';
	}

	// Shadow CSS custom properties.
	if ( 'none' !== $shadow ) {
		if ( ! empty( $attrs['shadowColor'] ) ) {
			$custom_props[] = '--lgl-shadow-color:' . sanitize_hex_color_with_alpha( $attrs['shadowColor'] );
		}
		if ( isset( $attrs['shadowBlur'] ) && null !== $attrs['shadowBlur'] ) {
			$custom_props[] = '--lgl-shadow-blur:' . (int) $attrs['shadowBlur'] . 'px';
		}
		if ( isset( $attrs['shadowSpread'] ) && null !== $attrs['shadowSpread'] ) {
			$custom_props[] = '--lgl-shadow-spread:' . (int) $attrs['shadowSpread'] . 'px';
		}
		if ( isset( $attrs['shadowOffsetX'] ) && null !== $attrs['shadowOffsetX'] ) {
			$custom_props[] = '--lgl-shadow-x:' . (int) $attrs['shadowOffsetX'] . 'px';
		}
		if ( isset( $attrs['shadowOffsetY'] ) && null !== $attrs['shadowOffsetY'] ) {
			$custom_props[] = '--lgl-shadow-y:' . (int) $attrs['shadowOffsetY'] . 'px';
		}
	}

	// Read border-radius from the block's style attribute and forward it.
	$border_radius = lgl_get_border_radius( $block );
	if ( $border_radius ) {
		$custom_props[] = '--lgl-border-radius:' . $border_radius;
	}

	$style_string = implode( ';', $custom_props );

	// For core/button, target the inner <a> element.
	if ( 'core/button' === $block['blockName'] ) {
		$block_content = lgl_inject_on_button( $block_content, $classes, $style_string );
	} else {
		$block_content = lgl_inject_on_wrapper( $block_content, $classes, $style_string );
	}

	// Append per-block SVG filter for tier 2 effects.
	if ( $is_tier2 && isset( $filter_id ) ) {
		$block_content .= lgl_build_filter_svg( $filter_id, $effect, $attrs );
	}

	return $block_content;
}
add_filter( 'render_block', 'lgl_render_block', 10, 2 );

/**
 * Inject classes and styles onto the block's outer wrapper element.
 */
function lgl_inject_on_wrapper( $html, $classes, $style ) {
	$processor = new WP_HTML_Tag_Processor( $html );

	if ( ! $processor->next_tag() ) {
		return $html;
	}

	foreach ( explode( ' ', $classes ) as $cls ) {
		$processor->add_class( $cls );
	}

	if ( $style ) {
		$existing = $processor->get_attribute( 'style' ) ?? '';
		$separator = $existing && ! str_ends_with( trim( $existing ), ';' ) ? ';' : '';
		$processor->set_attribute( 'style', $existing . $separator . $style );
	}

	return $processor->get_updated_html();
}

/**
 * Inject classes and styles onto the inner <a> of core/button.
 */
function lgl_inject_on_button( $html, $classes, $style ) {
	$processor = new WP_HTML_Tag_Processor( $html );

	// Skip the outer <div> and find the inner <a>.
	if ( ! $processor->next_tag( 'a' ) ) {
		return $html;
	}

	foreach ( explode( ' ', $classes ) as $cls ) {
		$processor->add_class( $cls );
	}

	if ( $style ) {
		$existing = $processor->get_attribute( 'style' ) ?? '';
		$separator = $existing && ! str_ends_with( trim( $existing ), ';' ) ? ';' : '';
		$processor->set_attribute( 'style', $existing . $separator . $style );
	}

	return $processor->get_updated_html();
}

/**
 * Extract border-radius from the block's existing style attribute.
 * Core stores it as attrs.style.border.radius (string or object).
 */
function lgl_get_border_radius( $block ) {
	$radius = $block['attrs']['style']['border']['radius'] ?? null;

	if ( ! $radius ) {
		return '';
	}

	// Simple value: "24px", "1em", etc.
	if ( is_string( $radius ) ) {
		return esc_attr( $radius );
	}

	// Object with individual corners: topLeft, topRight, bottomRight, bottomLeft.
	if ( is_array( $radius ) ) {
		$tl = esc_attr( $radius['topLeft'] ?? '0px' );
		$tr = esc_attr( $radius['topRight'] ?? '0px' );
		$br = esc_attr( $radius['bottomRight'] ?? '0px' );
		$bl = esc_attr( $radius['bottomLeft'] ?? '0px' );
		return "$tl $tr $br $bl";
	}

	return '';
}

/**
 * Sanitize a hex color that may include an alpha channel.
 * Accepts #RGB, #RRGGBB, #RRGGBBAA, or CSS color keywords/functions.
 */
function sanitize_hex_color_with_alpha( $color ) {
	// Allow hex colors with optional alpha.
	if ( preg_match( '/^#([0-9a-fA-F]{3,8})$/', $color ) ) {
		return $color;
	}
	// Allow CSS color functions and keywords.
	return esc_attr( $color );
}
