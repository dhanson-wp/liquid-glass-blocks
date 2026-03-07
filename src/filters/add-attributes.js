/**
 * Register Liquid Glass attributes on supported blocks.
 *
 * Filter: blocks.registerBlockType
 */
import { SUPPORTED_BLOCKS } from '../constants';
import { DEFAULT_ATTRIBUTES } from '../presets';

export function addAttributes( settings, name ) {
	if ( ! SUPPORTED_BLOCKS.includes( name ) ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			...DEFAULT_ATTRIBUTES,
		},
	};
}
