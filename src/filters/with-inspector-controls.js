/**
 * Add a "Liquid Glass" panel to the block sidebar for supported blocks.
 *
 * Filter: editor.BlockEdit
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls, useSetting } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	RangeControl,
	Notice,
	ColorPalette,
} from '@wordpress/components';

import { SUPPORTED_BLOCKS } from '../constants';
import { PRESETS, PRESET_OPTIONS } from '../presets';

export const withInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const { name, attributes, setAttributes } = props;

			if ( ! SUPPORTED_BLOCKS.includes( name ) ) {
				return <BlockEdit { ...props } />;
			}

			const {
				liquidGlassBlocksEnabled,
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

			const colors = useSetting( 'color.palette' ) || [];

			const preset = liquidGlassBlocksPreset || 'heavy-frost';
			const isGlassFrost = preset === 'glass-frost';
			const isNoise = [ 'grain-frost', 'fine-frost' ].includes( preset );

			const onToggle = ( enabled ) => {
				if ( enabled ) {
					// Populate all attributes with the current preset defaults.
					const defaults = PRESETS[ preset ] || PRESETS[ 'heavy-frost' ];
					const { label, ...values } = defaults;
					setAttributes( {
						liquidGlassBlocksEnabled: true,
						liquidGlassBlocksPreset: preset,
						...values,
					} );
				} else {
					setAttributes( { liquidGlassBlocksEnabled: false } );
				}
			};

			const onPresetChange = ( newPreset ) => {
				const presetData = PRESETS[ newPreset ];
				if ( ! presetData ) {
					return;
				}
				const { label, ...values } = presetData;
				setAttributes( {
					liquidGlassBlocksPreset: newPreset,
					...values,
				} );
			};

			return (
				<>
					<BlockEdit { ...props } />
					<InspectorControls>
						<PanelBody
							title="Liquid Glass"
							initialOpen={ liquidGlassBlocksEnabled }
						>
							<ToggleControl
								__nextHasNoMarginBottom
								label="Enable effect"
								checked={ !! liquidGlassBlocksEnabled }
								onChange={ onToggle }
							/>

							{ liquidGlassBlocksEnabled && (
								<>
									<Notice
										status="info"
										isDismissible={ false }
										className="lgl-background-notice"
									>
										This effect requires content behind the
										block to blur — a background image,
										gradient, or another element underneath.
									</Notice>

									<SelectControl
										__nextHasNoMarginBottom
										label="Preset"
										value={ preset }
										options={ PRESET_OPTIONS }
										onChange={ onPresetChange }
									/>

									<RangeControl
										__nextHasNoMarginBottom
										label="Blur"
										value={ liquidGlassBlocksBlur ?? 24 }
										onChange={ ( v ) =>
											setAttributes( {
												liquidGlassBlocksBlur: v,
											} )
										}
										min={ 0 }
										max={ 40 }
										step={ 1 }
									/>

									<p className="lgl-control-label">
										Tint Color
									</p>
									<ColorPalette
										colors={ colors }
										value={ liquidGlassBlocksTintColor }
										onChange={ ( v ) =>
											setAttributes( {
												liquidGlassBlocksTintColor:
													v || '#ffffff',
											} )
										}
										clearable={ false }
									/>

									<RangeControl
										__nextHasNoMarginBottom
										label="Tint Opacity"
										value={ liquidGlassBlocksTintOpacity ?? 25 }
										onChange={ ( v ) =>
											setAttributes( {
												liquidGlassBlocksTintOpacity: v,
											} )
										}
										min={ 0 }
										max={ 100 }
										step={ 1 }
									/>

									{ isGlassFrost && (
										<RangeControl
											__nextHasNoMarginBottom
											label="Saturation"
											value={
												liquidGlassBlocksSaturation ?? 1
											}
											onChange={ ( v ) =>
												setAttributes( {
													liquidGlassBlocksSaturation: v,
												} )
											}
											min={ 0 }
											max={ 3 }
											step={ 0.1 }
										/>
									) }

									<RangeControl
										__nextHasNoMarginBottom
										label="Border Width"
										value={
											liquidGlassBlocksBorderWidth ?? 1
										}
										onChange={ ( v ) =>
											setAttributes( {
												liquidGlassBlocksBorderWidth: v,
											} )
										}
										min={ 0 }
										max={ 3 }
										step={ 1 }
									/>

									<RangeControl
										__nextHasNoMarginBottom
										label="Border Radius"
										value={
											liquidGlassBlocksBorderRadius ?? 0
										}
										onChange={ ( v ) =>
											setAttributes( {
												liquidGlassBlocksBorderRadius: v,
											} )
										}
										min={ 0 }
										max={ 50 }
										step={ 1 }
									/>

									<ToggleControl
										__nextHasNoMarginBottom
										label="Shadow"
										checked={ liquidGlassBlocksShadow !== false }
										onChange={ ( v ) =>
											setAttributes( {
												liquidGlassBlocksShadow: v,
											} )
										}
									/>

									{ isNoise && (
										<>
											<RangeControl
												__nextHasNoMarginBottom
												label="Noise Intensity"
												value={
													liquidGlassBlocksNoiseIntensity ??
													50
												}
												onChange={ ( v ) =>
													setAttributes( {
														liquidGlassBlocksNoiseIntensity:
															v,
													} )
												}
												min={ 0 }
												max={ 100 }
												step={ 1 }
											/>

											</>
									) }
								</>
							) }
						</PanelBody>
					</InspectorControls>
				</>
			);
		};
	},
	'liquidGlassBlocksWithInspectorControls'
);
