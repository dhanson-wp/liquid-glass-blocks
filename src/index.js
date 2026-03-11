/**
 * Liquid Glass Blocks — editor entry point.
 * Registers all block filters.
 */

import { addFilter } from '@wordpress/hooks';

import { addLiquidGlassAttributes } from './filters/add-attributes';
import { withInspectorControls } from './filters/with-inspector-controls';
import { withWrapperProps } from './filters/add-wrapper-props';

addFilter(
	'blocks.registerBlockType',
	'liquid-glass-blocks/add-attributes',
	addLiquidGlassAttributes
);

addFilter(
	'editor.BlockEdit',
	'liquid-glass-blocks/with-inspector-controls',
	withInspectorControls
);

addFilter(
	'editor.BlockListBlock',
	'liquid-glass-blocks/with-wrapper-props',
	withWrapperProps
);
