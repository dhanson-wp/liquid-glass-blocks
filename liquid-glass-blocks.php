<?php
/**
 * Plugin Name: Liquid Glass Blocks
 * Description: Liquid glass / glassmorphism effects for WordPress core blocks.
 * Version:     1.0.0
 * Requires at least: 6.7
 * Requires PHP: 7.4
 * Author:      Derek Hanson
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: liquid-glass-blocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'LGL_VERSION', '1.0.0' );
define( 'LGL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LGL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Supported blocks — the single source of truth.
 */
define( 'LGL_SUPPORTED_BLOCKS', array(
	'core/group',
	'core/cover',
	'core/button',
) );

require_once LGL_PLUGIN_DIR . 'includes/render.php';

/**
 * Enqueue the editor script.
 */
function lgl_enqueue_editor_assets() {
	$asset_file = LGL_PLUGIN_DIR . 'build/index.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = include $asset_file;

	wp_enqueue_script(
		'liquid-glass-blocks-editor',
		LGL_PLUGIN_URL . 'build/index.js',
		$asset['dependencies'],
		$asset['version']
	);
}
add_action( 'enqueue_block_editor_assets', 'lgl_enqueue_editor_assets' );

/**
 * Enqueue the stylesheet (editor canvas + frontend).
 *
 * Uses enqueue_block_assets so the CSS reaches the iframed editor canvas
 * in WP 6.9+. On the frontend the stylesheet is only loaded when a
 * supported block is present in the post content.
 */
function lgl_enqueue_assets() {
	if ( is_admin() ) {
		wp_enqueue_style(
			'liquid-glass-blocks',
			LGL_PLUGIN_URL . 'assets/liquid-glass-blocks.css',
			array(),
			LGL_VERSION
		);
		return;
	}

	foreach ( LGL_SUPPORTED_BLOCKS as $block_name ) {
		if ( has_block( $block_name ) ) {
			wp_enqueue_style(
				'liquid-glass-blocks',
				LGL_PLUGIN_URL . 'assets/liquid-glass-blocks.css',
				array(),
				LGL_VERSION
			);
			return;
		}
	}
}
add_action( 'enqueue_block_assets', 'lgl_enqueue_assets' );
