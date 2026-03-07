/**
 * Liquid Glass Blocks — Editor entry point.
 *
 * Registers block filters that extend supported core blocks with
 * liquid glass / glassmorphism controls and rendering.
 */
import { addFilter } from '@wordpress/hooks';

import { addAttributes } from './filters/add-attributes';
import { withInspectorControls } from './filters/with-inspector-controls';
import { addWrapperProps } from './filters/add-wrapper-props';

// Register custom attributes on supported blocks.
addFilter(
	'blocks.registerBlockType',
	'liquid-glass-blocks/add-attributes',
	addAttributes
);

// Add the Liquid Glass sidebar panel.
addFilter(
	'editor.BlockEdit',
	'liquid-glass-blocks/with-inspector-controls',
	withInspectorControls
);

// Inject data attributes and CSS custom properties onto editor wrappers.
addFilter(
	'editor.BlockListBlock',
	'liquid-glass-blocks/add-wrapper-props',
	addWrapperProps
);
