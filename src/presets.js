/**
 * Liquid Glass presets.
 *
 * Each preset is a named set of default attribute values. Selecting a preset
 * populates all controls; the user then adjusts individually.
 */
export const PRESETS = {
	'heavy-frost': {
		label: 'Heavy Frost',
		liquidGlassBlocksBlur: 28,
		liquidGlassBlocksTintColor: '#ffffff',
		liquidGlassBlocksTintOpacity: 30,
		liquidGlassBlocksSaturation: 1,
		liquidGlassBlocksBorderWidth: 1,
		liquidGlassBlocksBorderRadius: 0,
		liquidGlassBlocksShadow: true,
		liquidGlassBlocksNoiseIntensity: 50,
		liquidGlassBlocksNoiseScale: 65,
	},
	'soft-mist': {
		label: 'Soft Mist',
		liquidGlassBlocksBlur: 20,
		liquidGlassBlocksTintColor: '#ffffff',
		liquidGlassBlocksTintOpacity: 18,
		liquidGlassBlocksSaturation: 1,
		liquidGlassBlocksBorderWidth: 1,
		liquidGlassBlocksBorderRadius: 0,
		liquidGlassBlocksShadow: true,
		liquidGlassBlocksNoiseIntensity: 50,
		liquidGlassBlocksNoiseScale: 65,
	},
	'glass-frost': {
		label: 'Glass Frost',
		liquidGlassBlocksBlur: 12,
		liquidGlassBlocksTintColor: '#ffffff',
		liquidGlassBlocksTintOpacity: 10,
		liquidGlassBlocksSaturation: 2.2,
		liquidGlassBlocksBorderWidth: 0,
		liquidGlassBlocksBorderRadius: 0,
		liquidGlassBlocksShadow: true,
		liquidGlassBlocksNoiseIntensity: 50,
		liquidGlassBlocksNoiseScale: 65,
	},
	'light-frost': {
		label: 'Light Frost',
		liquidGlassBlocksBlur: 8,
		liquidGlassBlocksTintColor: '#ffffff',
		liquidGlassBlocksTintOpacity: 8,
		liquidGlassBlocksSaturation: 1,
		liquidGlassBlocksBorderWidth: 1,
		liquidGlassBlocksBorderRadius: 0,
		liquidGlassBlocksShadow: true,
		liquidGlassBlocksNoiseIntensity: 50,
		liquidGlassBlocksNoiseScale: 65,
	},
	'grain-frost': {
		label: 'Grain Frost',
		liquidGlassBlocksBlur: 20,
		liquidGlassBlocksTintColor: '#ffffff',
		liquidGlassBlocksTintOpacity: 24,
		liquidGlassBlocksSaturation: 1,
		liquidGlassBlocksBorderWidth: 1,
		liquidGlassBlocksBorderRadius: 0,
		liquidGlassBlocksShadow: true,
		liquidGlassBlocksNoiseIntensity: 50,
		liquidGlassBlocksNoiseScale: 65,
	},
	'fine-frost': {
		label: 'Fine Frost',
		liquidGlassBlocksBlur: 10,
		liquidGlassBlocksTintColor: '#ffffff',
		liquidGlassBlocksTintOpacity: 12,
		liquidGlassBlocksSaturation: 1,
		liquidGlassBlocksBorderWidth: 1,
		liquidGlassBlocksBorderRadius: 0,
		liquidGlassBlocksShadow: true,
		liquidGlassBlocksNoiseIntensity: 30,
		liquidGlassBlocksNoiseScale: 120,
	},
};

/**
 * Preset slugs in display order.
 */
export const PRESET_OPTIONS = Object.entries( PRESETS ).map(
	( [ slug, { label } ] ) => ( {
		label,
		value: slug,
	} )
);

/**
 * Default attribute values (matches the first preset, heavy-frost).
 */
export const DEFAULT_ATTRIBUTES = {
	liquidGlassBlocksEnabled: { type: 'boolean', default: false },
	liquidGlassBlocksPreset: { type: 'string', default: 'heavy-frost' },
	liquidGlassBlocksBlur: { type: 'number', default: 28 },
	liquidGlassBlocksTintColor: { type: 'string', default: '#ffffff' },
	liquidGlassBlocksTintOpacity: { type: 'number', default: 30 },
	liquidGlassBlocksSaturation: { type: 'number', default: 1 },
	liquidGlassBlocksBorderWidth: { type: 'number', default: 1 },
	liquidGlassBlocksBorderRadius: { type: 'number', default: 0 },
	liquidGlassBlocksShadow: { type: 'boolean', default: true },
	liquidGlassBlocksNoiseIntensity: { type: 'number', default: 50 },
	liquidGlassBlocksNoiseScale: { type: 'number', default: 65 },
};
