/**
 * Filter: editor.BlockListBlock
 * Adds liquid glass CSS classes and custom properties to block wrappers
 * in the editor. Injects per-block SVG filter definitions into the editor
 * iframe document for tier 2 effects.
 */

import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

import {
	LGL_SUPPORTED_BLOCKS,
	EFFECT_PRESETS,
	TIER2_FILTER_CONFIG,
} from '../constants';

/**
 * Build an SVG string containing a single <filter> element with the given parameters.
 *
 * @param {string} filterId  Unique filter ID for this block.
 * @param {string} effect    The active tier 2 effect slug.
 * @param {Object} params    Filter parameters from block attributes.
 * @return {string} SVG markup string, or empty string if not a tier 2 effect.
 */
function buildFilterSvg( filterId, effect, params ) {
	const config = TIER2_FILTER_CONFIG[ effect ];
	if ( ! config ) {
		return '';
	}

	const { noiseType, seed } = config;
	const scale = params.distortionScale ?? 30;
	const freq = params.noiseFrequency ?? 0.02;
	const octaves = params.noiseOctaves ?? 2;
	const smoothing = params.noiseSmoothing ?? 0;

	const seedAttr = seed ? ` seed="${ seed }"` : '';
	const freqStr = `${ freq } ${ freq }`;

	let inner = `<feTurbulence type="${ noiseType }" baseFrequency="${ freqStr }" numOctaves="${ octaves }"${ seedAttr } result="noise"/>`;

	if ( smoothing > 0 ) {
		inner += `<feGaussianBlur in="noise" stdDeviation="${ smoothing }" result="smooth"/>`;
		inner += `<feDisplacementMap in="SourceGraphic" in2="smooth" scale="${ scale }" xChannelSelector="R" yChannelSelector="G"/>`;
	} else {
		inner += `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${ scale }" xChannelSelector="R" yChannelSelector="G"/>`;
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" id="lgl-svg-${ filterId }" width="0" height="0" style="position:absolute"><defs><filter id="${ filterId }" x="0%" y="0%" width="100%" height="100%">${ inner }</filter></defs></svg>`;
}

/**
 * Find the editor iframe document. WP 6.5+ uses an iframe named "editor-canvas".
 * Falls back to the current document if no iframe is found.
 */
function getEditorDocument() {
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
	if ( iframe && iframe.contentDocument ) {
		return iframe.contentDocument;
	}
	return document;
}

export const withWrapperProps = createHigherOrderComponent(
	( BlockListBlock ) => {
		return ( props ) => {
			if ( ! LGL_SUPPORTED_BLOCKS.includes( props.name ) ) {
				return <BlockListBlock { ...props } />;
			}

			const glass = props.attributes.liquidGlass || {};
			const enabled = !! glass.enable;
			const effect = glass.effect || 'heavy-frost';
			const preset = EFFECT_PRESETS.find( ( p ) => p.value === effect );
			const isTier2 = preset?.tier === 2;

			// Per-block SVG filter injection for tier 2 effects.
			const filterId = `lgl-filter-${ props.clientId }`;
			const svgElementId = `lgl-svg-${ filterId }`;

			useEffect( () => {
				if ( ! enabled || ! isTier2 ) {
					return;
				}

				const doc = getEditorDocument();

				// Remove existing SVG for this block (re-created on param changes).
				const existing = doc.getElementById( svgElementId );
				if ( existing ) {
					existing.remove();
				}

				// Create and inject the per-block SVG.
				const svgMarkup = buildFilterSvg( filterId, effect, glass );
				if ( svgMarkup ) {
					const parser = new DOMParser();
					const svgDoc = parser.parseFromString( svgMarkup, 'image/svg+xml' );
					const svg = doc.importNode( svgDoc.documentElement, true );
					doc.body.appendChild( svg );
				}

				// Cleanup on unmount or dependency change.
				return () => {
					const doc2 = getEditorDocument();
					const el = doc2.getElementById( svgElementId );
					if ( el ) {
						el.remove();
					}
				};
			}, [
				enabled,
				isTier2,
				effect,
				filterId,
				svgElementId,
				glass.distortionScale,
				glass.noiseFrequency,
				glass.noiseOctaves,
				glass.noiseSmoothing,
			] );

			if ( ! enabled ) {
				return <BlockListBlock { ...props } />;
			}

			const shadow = glass.shadowEffect || 'none';
			const isTier1 = preset?.tier === 1;

			// Build class string.
			let className = `lgl-effect-${ effect }`;
			if ( shadow !== 'none' ) {
				className += ` lgl-shadow-${ shadow }`;
			}

			// Build inline style with CSS custom properties.
			const style = {};

			if ( isTier1 ) {
				style[ '--lgl-blur' ] =
					( glass.backdropFilter ?? 24 ) + 'px';
				if ( glass.backgroundColor ) {
					style[ '--lgl-bg' ] = glass.backgroundColor;
				}
				if ( effect === 'soft-mist' ) {
					style[ '--lgl-brightness' ] = glass.brightness ?? 1;
				}
			} else {
				// Tier 2: accent color + per-block filter reference + blur.
				if ( glass.accent ) {
					style[ '--lgl-accent' ] = glass.accent;
				}
				style[ '--lgl-filter' ] = `url(#${ filterId })`;
				style[ '--lgl-tier2-blur' ] =
					( glass.tier2Blur ?? 5 ) + 'px';
			}

			// Shadow CSS custom properties.
			if ( shadow !== 'none' ) {
				if ( glass.shadowColor ) {
					style[ '--lgl-shadow-color' ] = glass.shadowColor;
				}
				if ( glass.shadowBlur != null ) {
					style[ '--lgl-shadow-blur' ] = glass.shadowBlur + 'px';
				}
				if ( glass.shadowSpread != null ) {
					style[ '--lgl-shadow-spread' ] =
						glass.shadowSpread + 'px';
				}
				if ( glass.shadowOffsetX != null ) {
					style[ '--lgl-shadow-x' ] =
						glass.shadowOffsetX + 'px';
				}
				if ( glass.shadowOffsetY != null ) {
					style[ '--lgl-shadow-y' ] =
						glass.shadowOffsetY + 'px';
				}
			}

			// Read border-radius from the block's style attribute.
			const borderRadius =
				props.attributes.style?.border?.radius;
			if ( borderRadius ) {
				if ( typeof borderRadius === 'string' ) {
					style[ '--lgl-border-radius' ] = borderRadius;
				} else if ( typeof borderRadius === 'object' ) {
					const tl = borderRadius.topLeft || '0px';
					const tr = borderRadius.topRight || '0px';
					const br = borderRadius.bottomRight || '0px';
					const bl = borderRadius.bottomLeft || '0px';
					style[ '--lgl-border-radius' ] =
						`${ tl } ${ tr } ${ br } ${ bl }`;
				}
			}

			// Merge with existing wrapperProps.
			const existingClassName =
				props.wrapperProps?.className || '';
			const existingStyle = props.wrapperProps?.style || {};

			const wrapperProps = {
				...( props.wrapperProps || {} ),
				className: (
					existingClassName +
					' ' +
					className
				).trim(),
				style: { ...existingStyle, ...style },
			};

			return (
				<BlockListBlock { ...props } wrapperProps={ wrapperProps } />
			);
		};
	},
	'withLiquidGlassWrapperProps'
);
