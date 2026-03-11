/**
 * Filter: blocks.registerBlockType
 * Adds the liquidGlass attribute to supported blocks.
 */

import { LGL_SUPPORTED_BLOCKS, DEFAULT_ATTRIBUTES } from '../constants';

export function addLiquidGlassAttributes( settings, name ) {
	if ( ! LGL_SUPPORTED_BLOCKS.includes( name ) ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			liquidGlass: {
				type: 'object',
				default: { ...DEFAULT_ATTRIBUTES },
			},
		},
	};
}
