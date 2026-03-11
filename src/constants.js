/**
 * Shared constants for Liquid Glass Blocks.
 */

export const LGL_SUPPORTED_BLOCKS = [
	'core/group',
	'core/button',
];

export const EFFECT_PRESETS = [
	{ value: 'heavy-frost', label: 'Heavy Frost', tier: 1 },
	{ value: 'soft-mist', label: 'Soft Mist', tier: 1 },
	{ value: 'light-frost', label: 'Light Frost', tier: 2 },
	{ value: 'grain-frost', label: 'Grain Frost', tier: 2 },
	{ value: 'fine-frost', label: 'Fine Frost', tier: 2 },
];

export const SHADOW_OPTIONS = [
	{ value: 'none', label: 'None' },
	{ value: 'drop', label: 'Drop Shadow' },
	{ value: 'glow', label: 'Glow Halo' },
	{ value: 'soft', label: 'Soft Diffused' },
	{ value: 'frosted', label: 'Frosted Inset' },
];

/**
 * Per-preset SVG filter configuration.
 * noiseType and seed are fixed per preset; the user adjusts numeric params.
 */
export const TIER2_FILTER_CONFIG = {
	'light-frost': { noiseType: 'fractalNoise', seed: 92 },
	'grain-frost': { noiseType: 'fractalNoise', seed: 9000 },
	'fine-frost': { noiseType: 'turbulence', seed: 0 },
};

export const PRESET_DEFAULTS = {
	'heavy-frost': {
		backgroundColor: '#FFFFFF1F',
		backdropFilter: 24,
		brightness: 1,
		accent: '',
		distortionScale: 30,
		noiseFrequency: 0.02,
		noiseOctaves: 2,
		noiseSmoothing: 0,
		tier2Blur: 5,
	},
	'soft-mist': {
		backgroundColor: '#753B3B1F',
		backdropFilter: 20,
		brightness: 1,
		accent: '',
		distortionScale: 30,
		noiseFrequency: 0.02,
		noiseOctaves: 2,
		noiseSmoothing: 0,
		tier2Blur: 5,
	},
	'light-frost': {
		backgroundColor: '',
		backdropFilter: 24,
		brightness: 1,
		accent: 'currentColor',
		distortionScale: 30,
		noiseFrequency: 0.02,
		noiseOctaves: 2,
		noiseSmoothing: 0.02,
		tier2Blur: 5,
	},
	'grain-frost': {
		backgroundColor: '',
		backdropFilter: 24,
		brightness: 1,
		accent: 'currentColor',
		distortionScale: 30,
		noiseFrequency: 0.02,
		noiseOctaves: 1,
		noiseSmoothing: 0.1,
		tier2Blur: 5,
	},
	'fine-frost': {
		backgroundColor: '',
		backdropFilter: 24,
		brightness: 1,
		accent: 'currentColor',
		distortionScale: 30,
		noiseFrequency: 0.02,
		noiseOctaves: 3,
		noiseSmoothing: 0,
		tier2Blur: 5,
	},
};

export const DEFAULT_ATTRIBUTES = {
	enable: false,
	effect: 'heavy-frost',
	backgroundColor: '#FFFFFF1F',
	backdropFilter: 24,
	brightness: 1,
	shadowEffect: 'none',
	accent: '',
	distortionScale: 30,
	noiseFrequency: 0.02,
	noiseOctaves: 2,
	noiseSmoothing: 0,
	tier2Blur: 5,
};
