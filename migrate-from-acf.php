<?php
/**
 * Migration script to convert ACF data to native WordPress post meta
 * 
 * IMPORTANT: This file should be run ONCE to migrate existing data.
 * After running, you can delete this file.
 * 
 * To use: Visit yoursite.com/?parts_breakout_migrate=1 while logged in as admin
 * 
 * @package Parts Breakout
 */

if ( ! defined( 'ABSPATH' ) ) {
    require_once '../../../wp-load.php';
}

// Security check
if ( ! isset( $_GET['parts_breakout_migrate'] ) || ! current_user_can( 'manage_options' ) ) {
    die( 'Access denied' );
}

// Prevent timeout
set_time_limit( 300 );

echo '<h1>Parts Breakout ACF Data Migration</h1>';
echo '<p>Starting migration...</p>';

// Get all parts-breakout posts
$posts = get_posts([
    'post_type' => 'parts-breakout',
    'posts_per_page' => -1,
    'post_status' => 'any',
]);

$migrated = 0;
$skipped = 0;

foreach ( $posts as $post ) {
    echo '<h3>Processing: ' . esc_html( $post->post_title ) . ' (ID: ' . $post->ID . ')</h3>';
    
    // Check if already migrated
    $existing = get_post_meta( $post->ID, '_parts_breakout_parts', true );
    if ( ! empty( $existing ) && is_array( $existing ) ) {
        echo '<p style="color: orange;">Skipped - already has native data</p>';
        $skipped++;
        continue;
    }
    
    // Check if ACF function exists
    if ( ! function_exists( 'get_field' ) ) {
        echo '<p style="color: red;">Error - ACF not available, cannot migrate</p>';
        break;
    }
    
    // Migrate settings
    $line_color = get_field( 'line_color', $post->ID );
    if ( $line_color ) {
        update_post_meta( $post->ID, '_parts_line_color', sanitize_hex_color( $line_color ) );
        echo '<p>✓ Migrated line color: ' . esc_html( $line_color ) . '</p>';
    }
    
    $circle_color = get_field( 'circle_color', $post->ID );
    if ( $circle_color ) {
        update_post_meta( $post->ID, '_parts_circle_color', sanitize_hex_color( $circle_color ) );
        echo '<p>✓ Migrated circle color: ' . esc_html( $circle_color ) . '</p>';
    }
    
    $cta_label = get_field( 'cta_label', $post->ID );
    if ( $cta_label ) {
        update_post_meta( $post->ID, '_parts_cta_label', sanitize_text_field( $cta_label ) );
        echo '<p>✓ Migrated CTA label: ' . esc_html( $cta_label ) . '</p>';
    }
    
    $cta_url = get_field( 'cta_url', $post->ID );
    if ( $cta_url ) {
        update_post_meta( $post->ID, '_parts_cta_url', esc_url_raw( $cta_url ) );
        echo '<p>✓ Migrated CTA URL: ' . esc_html( $cta_url ) . '</p>';
    }
    
    // Migrate parts
    $parts = [];
    if ( have_rows( 'parts', $post->ID ) ) {
        while ( have_rows( 'parts', $post->ID ) ) {
            the_row();
            
            $part_image = get_sub_field( 'part_image' );
            $image_id = 0;
            if ( is_array( $part_image ) && isset( $part_image['ID'] ) ) {
                $image_id = (int) $part_image['ID'];
            } elseif ( is_numeric( $part_image ) ) {
                $image_id = (int) $part_image;
            }
            
            $parts[] = [
                'image_id' => $image_id,
                'title' => sanitize_text_field( get_sub_field( 'part_title' ) ),
                'content' => wp_kses_post( get_sub_field( 'content' ) ),
                'left' => (float) get_sub_field( 'left' ),
                'top' => (float) get_sub_field( 'top' ),
                'line_x' => get_sub_field( 'line_x' ),
                'line_y' => get_sub_field( 'line_y' ),
            ];
        }
        
        update_post_meta( $post->ID, '_parts_breakout_parts', $parts );
        echo '<p>✓ Migrated ' . count( $parts ) . ' parts</p>';
    }
    
    // Migrate below content
    $below_content = get_field( 'below_parts_content', $post->ID );
    if ( $below_content ) {
        update_post_meta( $post->ID, '_parts_below_content', wp_kses_post( $below_content ) );
        echo '<p>✓ Migrated below content</p>';
    }
    
    $migrated++;
    echo '<p style="color: green;"><strong>✓ Migration complete for this post</strong></p>';
}

echo '<hr>';
echo '<h2>Migration Summary</h2>';
echo '<p><strong>Total posts processed:</strong> ' . count( $posts ) . '</p>';
echo '<p><strong>Successfully migrated:</strong> ' . $migrated . '</p>';
echo '<p><strong>Skipped:</strong> ' . $skipped . '</p>';
echo '<p style="color: green;"><strong>Migration complete!</strong></p>';
echo '<p>You can now deactivate ACF if you wish. This migration script can be deleted.</p>';

