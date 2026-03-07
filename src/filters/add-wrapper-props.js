/**
 * Add data attributes and CSS custom properties to block wrappers in the editor.
 *
 * Filter: editor.BlockListBlock
 */
import { createHigherOrderComponent } from '@wordpress/compose';

import { SUPPORTED_BLOCKS } from '../constants';
import { buildCustomProperties } from '../utils';

export const addWrapperProps = createHigherOrderComponent(
	( BlockListBlock ) => {
		return ( props ) => {
			const { attributes, name } = props;

			if (
				! SUPPORTED_BLOCKS.includes( name ) ||
				! attributes.liquidGlassBlocksEnabled
			) {
				return <BlockListBlock { ...props } />;
			}

			const preset =
				attributes.liquidGlassBlocksPreset || 'heavy-frost';
			const customProperties = buildCustomProperties( attributes );

			const wrapperProps = {
				...props.wrapperProps,
				'data-lgl-effect': preset,
				style: {
					...( props.wrapperProps?.style || {} ),
					...customProperties,
				},
			};

			return (
				<BlockListBlock { ...props } wrapperProps={ wrapperProps } />
			);
		};
	},
	'liquidGlassBlocksAddWrapperProps'
);
