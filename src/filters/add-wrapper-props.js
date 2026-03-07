/**
 * Add data attributes and CSS custom properties to block wrappers in the editor.
 *
 * Also injects the hidden SVG noise filter definitions into the editor
 * document so that CSS filter: url(#id) references resolve.
 *
 * Filter: editor.BlockListBlock
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

import { SUPPORTED_BLOCKS } from '../constants';
import { buildCustomProperties } from '../utils';

/**
 * SVG markup containing all shared filter definitions.
 * Injected once into the editor document via useEffect.
 */
const LGL_SVG_FILTERS =
	'<svg id="lgl-svg-filters" aria-hidden="true" focusable="false"'
	+ ' style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none">'
	+ '<defs>'
	+ '<filter id="lgl-noise-grain" x="0%" y="0%" width="100%" height="100%"'
	+ ' color-interpolation-filters="sRGB">'
	+ '<feTurbulence type="fractalNoise" baseFrequency="0.65"'
	+ ' numOctaves="4" stitchTiles="stitch"/>'
	+ '<feColorMatrix type="saturate" values="0"/>'
	+ '</filter>'
	+ '<filter id="lgl-noise-fine" x="0%" y="0%" width="100%" height="100%"'
	+ ' color-interpolation-filters="sRGB">'
	+ '<feTurbulence type="fractalNoise" baseFrequency="1.2"'
	+ ' numOctaves="4" stitchTiles="stitch"/>'
	+ '<feColorMatrix type="saturate" values="0"/>'
	+ '</filter>'
	+ '</defs>'
	+ '</svg>';

export const addWrapperProps = createHigherOrderComponent(
	( BlockListBlock ) => {
		return ( props ) => {
			const { attributes, name } = props;

			const isSupported = SUPPORTED_BLOCKS.includes( name );
			const isEnabled =
				isSupported && attributes.liquidGlassBlocksEnabled;

			// Inject SVG filter definitions into the editor document once.
			// The hook is called unconditionally (rules of hooks) but only
			// performs work when a supported block has the effect enabled.
			useEffect( () => {
				if ( ! isEnabled ) {
					return;
				}
				if ( document.getElementById( 'lgl-svg-filters' ) ) {
					return;
				}

				const temp = document.createElement( 'div' );
				temp.innerHTML = LGL_SVG_FILTERS;
				document.body.appendChild( temp.firstElementChild );
			}, [ isEnabled ] );

			if ( ! isEnabled ) {
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
