/**
 * Filter: editor.BlockEdit
 * Renders the "Liquid Glass" sidebar panel with controls.
 */

import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	RangeControl,
	Notice,
} from '@wordpress/components';
import { ColorPalette, useSetting } from '@wordpress/block-editor';

import {
	LGL_SUPPORTED_BLOCKS,
	EFFECT_PRESETS,
	SHADOW_OPTIONS,
	SHADOW_DEFAULTS,
	PRESET_DEFAULTS,
} from '../constants';

export const withInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			if ( ! LGL_SUPPORTED_BLOCKS.includes( props.name ) ) {
				return <BlockEdit { ...props } />;
			}

			const { attributes, setAttributes } = props;
			const glass = attributes.liquidGlass || {};
			const enabled = !! glass.enable;
			const effect = glass.effect || 'heavy-frost';
			const preset = EFFECT_PRESETS.find( ( p ) => p.value === effect );
			const isTier1 = preset?.tier === 1;
			const isTier2 = preset?.tier === 2;
			const isSoftMist = effect === 'soft-mist';

			const colors = useSetting( 'color.palette' );

			const updateGlass = ( updates ) => {
				setAttributes( {
					liquidGlass: { ...glass, ...updates },
				} );
			};

			const onPresetChange = ( newEffect ) => {
				const defaults = PRESET_DEFAULTS[ newEffect ] || {};
				updateGlass( {
					effect: newEffect,
					...defaults,
				} );
			};

			return (
				<Fragment>
					<BlockEdit { ...props } />
					<InspectorControls>
						<PanelBody
							title="Liquid Glass"
							initialOpen={ false }
						>
							<ToggleControl
								label="Enable Liquid Glass"
								checked={ enabled }
								onChange={ ( value ) =>
									updateGlass( { enable: value } )
								}
							/>

							{ enabled && (
								<>
									<Notice
										status="info"
										isDismissible={ false }
									>
										Use Liquid Glass inside a wrapper with
										a background image. Make the block
										background transparent and adjust
										padding as needed.
									</Notice>

									<SelectControl
										label="Effect Preset"
										value={ effect }
										options={ EFFECT_PRESETS }
										onChange={ onPresetChange }
									/>

									{ /* --- Tier 1 controls --- */ }

									{ isTier1 && (
										<>
											<p
												style={ {
													marginBottom: '8px',
													fontSize: '11px',
													textTransform: 'uppercase',
													fontWeight: 500,
												} }
											>
												Background Color
											</p>
											<ColorPalette
												colors={ colors }
												value={
													glass.backgroundColor || ''
												}
												onChange={ ( value ) =>
													updateGlass( {
														backgroundColor:
															value || '',
													} )
												}
												enableAlpha
											/>
										</>
									) }

									{ isTier1 && (
										<RangeControl
											label="Backdrop Blur"
											value={
												glass.backdropFilter ?? 24
											}
											onChange={ ( value ) =>
												updateGlass( {
													backdropFilter: value,
												} )
											}
											min={ 0 }
											max={ 50 }
											step={ 1 }
										/>
									) }

									{ isSoftMist && (
										<RangeControl
											label="Brightness"
											value={ glass.brightness ?? 1 }
											onChange={ ( value ) =>
												updateGlass( {
													brightness: value,
												} )
											}
											min={ 0 }
											max={ 5 }
											step={ 0.1 }
										/>
									) }

									{ /* --- Tier 2 controls --- */ }

									{ isTier2 && (
										<RangeControl
											label="Refraction"
											value={
												glass.distortionScale ?? 30
											}
											onChange={ ( value ) =>
												updateGlass( {
													distortionScale: value,
												} )
											}
											min={ 0 }
											max={ 100 }
											step={ 1 }
										/>
									) }

									{ isTier2 && (
										<RangeControl
											label="Noise Frequency"
											value={
												glass.noiseFrequency ?? 0.02
											}
											onChange={ ( value ) =>
												updateGlass( {
													noiseFrequency: value,
												} )
											}
											min={ 0.005 }
											max={ 0.1 }
											step={ 0.005 }
										/>
									) }

									{ isTier2 && (
										<RangeControl
											label="Noise Detail"
											value={
												glass.noiseOctaves ?? 2
											}
											onChange={ ( value ) =>
												updateGlass( {
													noiseOctaves: value,
												} )
											}
											min={ 1 }
											max={ 5 }
											step={ 1 }
										/>
									) }

									{ isTier2 && (
										<RangeControl
											label="Smoothing"
											value={
												glass.noiseSmoothing ?? 0
											}
											onChange={ ( value ) =>
												updateGlass( {
													noiseSmoothing: value,
												} )
											}
											min={ 0 }
											max={ 2 }
											step={ 0.01 }
										/>
									) }

									{ isTier2 && (
										<RangeControl
											label="Depth"
											value={ glass.tier2Blur ?? 5 }
											onChange={ ( value ) =>
												updateGlass( {
													tier2Blur: value,
												} )
											}
											min={ 1 }
											max={ 20 }
											step={ 1 }
										/>
									) }

									{ isTier2 && (
										<>
											<p
												style={ {
													marginBottom: '8px',
													fontSize: '11px',
													textTransform: 'uppercase',
													fontWeight: 500,
												} }
											>
												Accent Color
											</p>
											<ColorPalette
												colors={ colors }
												value={ glass.accent || '' }
												onChange={ ( value ) =>
													updateGlass( {
														accent: value || '',
													} )
												}
												enableAlpha
											/>
										</>
									) }

									<SelectControl
										label="Shadow Effect"
										value={
											glass.shadowEffect || 'none'
										}
										options={ SHADOW_OPTIONS }
										onChange={ ( value ) => {
											const defaults =
												SHADOW_DEFAULTS[ value ] ||
												{};
											updateGlass( {
												shadowEffect: value,
												shadowColor:
													defaults.color || '',
												shadowBlur:
													defaults.blur ?? null,
												shadowSpread:
													defaults.spread ??
													null,
												shadowOffsetX:
													defaults.x ?? null,
												shadowOffsetY:
													defaults.y ?? null,
											} );
										} }
									/>

									{ /* --- Shadow adjustment controls --- */ }

									{ glass.shadowEffect &&
										glass.shadowEffect !== 'none' && (
											<>
												<p
													style={ {
														marginBottom: '8px',
														fontSize: '11px',
														textTransform:
															'uppercase',
														fontWeight: 500,
													} }
												>
													Shadow Color
												</p>
												<ColorPalette
													colors={ colors }
													value={
														glass.shadowColor ||
														''
													}
													onChange={ ( value ) =>
														updateGlass( {
															shadowColor:
																value || '',
														} )
													}
													enableAlpha
												/>
											</>
										) }

									{ ( glass.shadowEffect === 'drop' ||
										glass.shadowEffect === 'glow' ||
										glass.shadowEffect === 'soft' ) && (
										<RangeControl
											label="Shadow Blur"
											value={
												glass.shadowBlur ??
												( SHADOW_DEFAULTS[
													glass.shadowEffect
												]?.blur ?? 28 )
											}
											onChange={ ( value ) =>
												updateGlass( {
													shadowBlur: value,
												} )
											}
											min={ 0 }
											max={ 100 }
											step={ 1 }
										/>
									) }

									{ ( glass.shadowEffect === 'drop' ||
										glass.shadowEffect === 'glow' ) && (
										<RangeControl
											label="Shadow Spread"
											value={
												glass.shadowSpread ??
												( SHADOW_DEFAULTS[
													glass.shadowEffect
												]?.spread ?? 2 )
											}
											onChange={ ( value ) =>
												updateGlass( {
													shadowSpread: value,
												} )
											}
											min={ -20 }
											max={ 50 }
											step={ 1 }
										/>
									) }

									{ glass.shadowEffect === 'drop' && (
										<>
											<RangeControl
												label="Offset X"
												value={
													glass.shadowOffsetX ??
													( SHADOW_DEFAULTS.drop
														?.x ?? -1 )
												}
												onChange={ ( value ) =>
													updateGlass( {
														shadowOffsetX:
															value,
													} )
												}
												min={ -50 }
												max={ 50 }
												step={ 1 }
											/>
											<RangeControl
												label="Offset Y"
												value={
													glass.shadowOffsetY ??
													( SHADOW_DEFAULTS.drop
														?.y ?? 9 )
												}
												onChange={ ( value ) =>
													updateGlass( {
														shadowOffsetY:
															value,
													} )
												}
												min={ -50 }
												max={ 50 }
												step={ 1 }
											/>
										</>
									) }
								</>
							) }
						</PanelBody>
					</InspectorControls>
				</Fragment>
			);
		};
	},
	'withLiquidGlassInspectorControls'
);
