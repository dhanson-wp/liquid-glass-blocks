<?php
/**
 * Plugin Name: Liquid Glass Blocks
 * Description: Adds liquid glass / glassmorphism effects to WordPress core blocks via block filters.
 * Version:     0.1.0-alpha
 * Author:      Derek Hanson
 * License:     GPL-2.0-or-later
 * Requires at least: 6.2
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LGL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LGL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Blocks that support the liquid glass effect.
 * core/group covers Group, Row, Stack, and Grid variations.
 */
define( 'LGL_SUPPORTED_BLOCKS', array(
	'core/group',
	'core/button',
) );

require_once LGL_PLUGIN_DIR . 'includes/render.php';

/**
 * Enqueue editor assets (JS).
 */
function lgl_enqueue_editor_assets() {
	$asset_file = LGL_PLUGIN_DIR . 'build/index.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = require $asset_file;

	wp_enqueue_script(
		'liquid-glass-blocks-editor',
		LGL_PLUGIN_URL . 'build/index.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'lgl_enqueue_editor_assets' );

/**
 * Enqueue shared stylesheet for both editor canvas and frontend.
 * Uses enqueue_block_assets so it reaches the WP 6.9+ iframed editor.
 */
function lgl_enqueue_block_assets() {
	if ( ! is_admin() && empty( $GLOBALS['lgl_has_glass'] ) ) {
		return;
	}

	wp_enqueue_style(
		'liquid-glass-blocks',
		LGL_PLUGIN_URL . 'assets/liquid-glass-blocks.css',
		array(),
		filemtime( LGL_PLUGIN_DIR . 'assets/liquid-glass-blocks.css' )
	);
}
add_action( 'enqueue_block_assets', 'lgl_enqueue_block_assets' );
