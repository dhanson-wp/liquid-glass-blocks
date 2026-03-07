/**
 * Convert a hex colour + opacity (0-100) to an rgba() string.
 *
 * Handles hex (#fff, #ffffff), rgb(), and rgba() inputs gracefully.
 *
 * @param {string} color   Colour value (hex preferred).
 * @param {number} opacity Opacity percentage 0-100.
 * @return {string} rgba() string.
 */
export function hexToRgba( color, opacity ) {
	const a = opacity / 100;

	if ( ! color ) {
		return `rgba(255,255,255,${ a })`;
	}

	// Already rgba — replace alpha.
	if ( color.startsWith( 'rgba' ) ) {
		return color.replace( /[\d.]+\)$/, `${ a })` );
	}

	// rgb — convert to rgba.
	if ( color.startsWith( 'rgb' ) ) {
		return color.replace( 'rgb(', 'rgba(' ).replace( ')', `,${ a })` );
	}

	// Hex — expand shorthand (#fff → #ffffff).
	let hex = color.replace( '#', '' );
	if ( hex.length === 3 ) {
		hex = hex[ 0 ] + hex[ 0 ] + hex[ 1 ] + hex[ 1 ] + hex[ 2 ] + hex[ 2 ];
	}

	const r = parseInt( hex.substring( 0, 2 ), 16 );
	const g = parseInt( hex.substring( 2, 4 ), 16 );
	const b = parseInt( hex.substring( 4, 6 ), 16 );

	return `rgba(${ r },${ g },${ b },${ a })`;
}

/**
 * Build a CSS custom property object from block attributes.
 *
 * Used in both the editor (wrapperProps style) and could be reused
 * if needed elsewhere. The PHP render filter mirrors this logic.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Style object with CSS custom properties.
 */
export function buildCustomProperties( attributes ) {
	const {
		liquidGlassBlocksPreset,
		liquidGlassBlocksBlur,
		liquidGlassBlocksTintColor,
		liquidGlassBlocksTintOpacity,
		liquidGlassBlocksSaturation,
		liquidGlassBlocksBorderWidth,
		liquidGlassBlocksBorderRadius,
		liquidGlassBlocksShadow,
		liquidGlassBlocksNoiseIntensity,
	} = attributes;

	const props = {
		'--lgl-blur': `${ liquidGlassBlocksBlur ?? 24 }px`,
		'--lgl-bg': hexToRgba(
			liquidGlassBlocksTintColor ?? '#ffffff',
			liquidGlassBlocksTintOpacity ?? 25
		),
		'--lgl-saturation': String( liquidGlassBlocksSaturation ?? 1 ),
		'--lgl-border-width': `${ liquidGlassBlocksBorderWidth ?? 1 }px`,
		'--lgl-border-radius': `${ liquidGlassBlocksBorderRadius ?? 0 }px`,
		'--lgl-shadow-opacity': liquidGlassBlocksShadow === false ? '0' : '1',
	};

	if ( [ 'grain-frost', 'fine-frost' ].includes( liquidGlassBlocksPreset ) ) {
		props[ '--lgl-noise-opacity' ] = String(
			( liquidGlassBlocksNoiseIntensity ?? 50 ) / 100
		);
	}

	return props;
}
