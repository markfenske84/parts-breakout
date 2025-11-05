<?php
/*
Plugin Name: Parts Breakout
Description: Provides the Parts Breakout custom post type with interactive parts hotspots on images.
Version: 2.0.0
Author: Webfor
Author URI: https://webfor.com
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: parts-breakout
Update URI: false
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// Initialize Plugin Update Checker (only for non-WordPress.org installations)
// This is disabled for WordPress.org plugin directory submissions
if ( ! defined( 'PARTS_BREAKOUT_DISABLE_UPDATES' ) && file_exists( __DIR__ . '/plugin-update-checker/plugin-update-checker.php' ) ) {
    require_once __DIR__ . '/plugin-update-checker/plugin-update-checker.php';
    
    $partsBreakoutUpdateChecker = YahnisElsts\PluginUpdateChecker\v5p4\PucFactory::buildUpdateChecker(
        'https://github.com/markfenske84/parts-breakout',
        __FILE__,
        'parts-breakout'
    );

    // Set the branch to check for updates
    $partsBreakoutUpdateChecker->setBranch( 'main' );
}

class Parts_Breakout_Plugin {

    const CPT = 'parts-breakout';

    public function __construct() {
        add_action( 'init', [ $this, 'register_cpt' ] );
        add_filter( 'single_template', [ $this, 'load_single_template' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
        
        // Admin meta boxes
        add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
        add_action( 'save_post', [ $this, 'save_meta_boxes' ], 10, 2 );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_scripts' ] );
        
        // Register REST routes for saving part positions.
        add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
    }

    /**
     * Registers the Parts Breakout custom post type.
     */
    public function register_cpt() {
        $labels = [
            'name'                  => __( 'Parts Breakouts', 'parts-breakout' ),
            'singular_name'         => __( 'Parts Breakout', 'parts-breakout' ),
            'add_new'               => __( 'Add New', 'parts-breakout' ),
            'add_new_item'          => __( 'Add New Parts Breakout', 'parts-breakout' ),
            'edit_item'             => __( 'Edit Parts Breakout', 'parts-breakout' ),
            'new_item'              => __( 'New Parts Breakout', 'parts-breakout' ),
            'view_item'             => __( 'View Parts Breakout', 'parts-breakout' ),
            'all_items'             => __( 'All Parts Breakouts', 'parts-breakout' ),
            'search_items'          => __( 'Search Parts Breakouts', 'parts-breakout' ),
            'not_found'             => __( 'No Parts Breakouts found.', 'parts-breakout' ),
            'not_found_in_trash'    => __( 'No Parts Breakouts found in Trash.', 'parts-breakout' ),
            'menu_name'             => __( 'Parts Breakouts', 'parts-breakout' ),
        ];

        $args = [
            'labels'             => $labels,
            'public'             => true,
            'publicly_queryable' => true,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => true,
            'rewrite'            => [ 'slug' => 'parts-breakout' ],
            'capability_type'    => 'post',
            'has_archive'        => true,
            'hierarchical'       => false,
            'menu_position'      => 20,
            'menu_icon'          => 'dashicons-images-alt2',
            'supports'           => [ 'title', 'editor', 'thumbnail', 'revisions' ],
            'show_in_rest'       => true,
        ];

        register_post_type( self::CPT, $args );
    }

    /**
     * Add meta boxes to the admin interface
     */
    public function add_meta_boxes() {
        add_meta_box(
            'parts_breakout_settings',
            __( 'Breakout Settings', 'parts-breakout' ),
            [ $this, 'render_settings_meta_box' ],
            self::CPT,
            'normal',
            'high'
        );

        add_meta_box(
            'parts_breakout_parts',
            __( 'Parts', 'parts-breakout' ),
            [ $this, 'render_parts_meta_box' ],
            self::CPT,
            'normal',
            'high'
        );

        add_meta_box(
            'parts_breakout_below_content',
            __( 'Below Parts Content', 'parts-breakout' ),
            [ $this, 'render_below_content_meta_box' ],
            self::CPT,
            'normal',
            'default'
        );
    }

    /**
     * Render settings meta box
     */
    public function render_settings_meta_box( $post ) {
        wp_nonce_field( 'parts_breakout_settings', 'parts_breakout_settings_nonce' );

        $line_color = get_post_meta( $post->ID, '_parts_line_color', true );
        $line_color = $line_color ? $line_color : '#a92f2e';

        $circle_color = get_post_meta( $post->ID, '_parts_circle_color', true );
        $circle_color = $circle_color ? $circle_color : '#a92f2e';

        $cta_label = get_post_meta( $post->ID, '_parts_cta_label', true );
        $cta_label = $cta_label ? $cta_label : 'REQUEST ESTIMATE';

        $cta_url = get_post_meta( $post->ID, '_parts_cta_url', true );
        $cta_url = $cta_url ? $cta_url : 'https://www.hpsx.com/request-estimate/';

        ?>
        <table class="form-table">
            <tr>
                <th><label for="parts_line_color"><?php esc_html_e( 'Line Color', 'parts-breakout' ); ?></label></th>
                <td>
                    <input type="text" name="parts_line_color" id="parts_line_color" value="<?php echo esc_attr( $line_color ); ?>" class="parts-color-picker" data-default-color="#a92f2e" />
                    <p class="description"><?php esc_html_e( 'Select the color for the connecting lines between parts.', 'parts-breakout' ); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="parts_circle_color"><?php esc_html_e( 'Circle Color', 'parts-breakout' ); ?></label></th>
                <td>
                    <input type="text" name="parts_circle_color" id="parts_circle_color" value="<?php echo esc_attr( $circle_color ); ?>" class="parts-color-picker" data-default-color="#a92f2e" />
                    <p class="description"><?php esc_html_e( 'Select the color for the pulsating circles behind parts.', 'parts-breakout' ); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="parts_cta_label"><?php esc_html_e( 'CTA Button Label', 'parts-breakout' ); ?></label></th>
                <td>
                    <input type="text" name="parts_cta_label" id="parts_cta_label" value="<?php echo esc_attr( $cta_label ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'Label for the call-to-action button in the sidebar.', 'parts-breakout' ); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="parts_cta_url"><?php esc_html_e( 'CTA Button URL', 'parts-breakout' ); ?></label></th>
                <td>
                    <input type="url" name="parts_cta_url" id="parts_cta_url" value="<?php echo esc_attr( $cta_url ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'URL for the call-to-action button.', 'parts-breakout' ); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Render parts meta box
     */
    public function render_parts_meta_box( $post ) {
        wp_nonce_field( 'parts_breakout_parts', 'parts_breakout_parts_nonce' );

        $parts = get_post_meta( $post->ID, '_parts_breakout_parts', true );
        if ( ! is_array( $parts ) ) {
            $parts = [];
        }

        ?>
        <div id="parts-breakout-repeater">
            <div id="parts-list">
                <?php
                foreach ( $parts as $index => $part ) {
                    $this->render_part_row( $index, $part );
                }
                ?>
            </div>
            <button type="button" class="button button-primary" id="add-part-btn">
                <?php esc_html_e( 'Add Part', 'parts-breakout' ); ?>
            </button>
        </div>

        <script type="text/html" id="part-row-template">
            <?php $this->render_part_row( '{{INDEX}}', [] ); ?>
        </script>
        <?php
    }

    /**
     * Render a single part row
     */
    private function render_part_row( $index, $part = [] ) {
        $image_id = isset( $part['image_id'] ) ? (int) $part['image_id'] : 0;
        $title = isset( $part['title'] ) ? $part['title'] : '';
        $content = isset( $part['content'] ) ? $part['content'] : '';
        $left = isset( $part['left'] ) ? $part['left'] : 50;
        $top = isset( $part['top'] ) ? $part['top'] : 50;
        $line_x = isset( $part['line_x'] ) ? $part['line_x'] : '';
        $line_y = isset( $part['line_y'] ) ? $part['line_y'] : '';

        $image_url = '';
        if ( $image_id ) {
            $image = wp_get_attachment_image_src( $image_id, 'thumbnail' );
            if ( $image ) {
                $image_url = $image[0];
            }
        }
        ?>
        <div class="part-row" data-index="<?php echo esc_attr( $index ); ?>">
            <div class="part-row-header">
                <h4><?php esc_html_e( 'Part', 'parts-breakout' ); ?> #<span class="part-number"><?php echo esc_html( is_numeric( $index ) ? $index + 1 : '{{NUMBER}}' ); ?></span></h4>
                <button type="button" class="button button-small remove-part-btn"><?php esc_html_e( 'Remove', 'parts-breakout' ); ?></button>
            </div>
            <table class="form-table">
                <tr>
                    <th><label><?php esc_html_e( 'Part Image', 'parts-breakout' ); ?></label></th>
                    <td>
                        <div class="part-image-preview">
                            <?php if ( $image_url ) : ?>
                                <img src="<?php echo esc_url( $image_url ); ?>" alt="" style="max-width: 80px; max-height: 80px;" />
                            <?php endif; ?>
                        </div>
                        <input type="hidden" name="parts[<?php echo esc_attr( $index ); ?>][image_id]" class="part-image-id" value="<?php echo esc_attr( $image_id ); ?>" />
                        <button type="button" class="button select-part-image"><?php esc_html_e( 'Select Image', 'parts-breakout' ); ?></button>
                        <?php if ( $image_url ) : ?>
                            <button type="button" class="button remove-part-image"><?php esc_html_e( 'Remove Image', 'parts-breakout' ); ?></button>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th><label><?php esc_html_e( 'Part Title', 'parts-breakout' ); ?></label></th>
                    <td>
                        <input type="text" name="parts[<?php echo esc_attr( $index ); ?>][title]" value="<?php echo esc_attr( $title ); ?>" class="regular-text" />
                    </td>
                </tr>
                <tr>
                    <th><label><?php esc_html_e( 'Content', 'parts-breakout' ); ?></label></th>
                    <td>
                        <?php
                        // Use wp_editor for existing parts (not template)
                        if ( is_numeric( $index ) ) {
                            $editor_id = 'part_content_' . $index;
                            wp_editor( $content, $editor_id, [
                                'textarea_name' => 'parts[' . $index . '][content]',
                                'textarea_rows' => 8,
                                'media_buttons' => true,
                                'teeny' => false,
                                'tinymce' => [
                                    'toolbar1' => 'formatselect,bold,italic,underline,bullist,numlist,link,unlink',
                                    'toolbar2' => '',
                                ],
                            ] );
                        } else {
                            // For template, use textarea that will be converted to editor via JS
                            ?>
                            <textarea name="parts[<?php echo esc_attr( $index ); ?>][content]" rows="4" class="large-text part-content-field"><?php echo esc_textarea( $content ); ?></textarea>
                            <?php
                        }
                        ?>
                    </td>
                </tr>
                <tr>
                    <th><label><?php esc_html_e( 'Position', 'parts-breakout' ); ?></label></th>
                    <td>
                        <label>
                            <?php esc_html_e( 'Left (%)', 'parts-breakout' ); ?>:
                            <input type="number" name="parts[<?php echo esc_attr( $index ); ?>][left]" value="<?php echo esc_attr( $left ); ?>" min="0" max="100" step="0.1" style="width: 80px;" />
                        </label>
                        <label style="margin-left: 15px;">
                            <?php esc_html_e( 'Top (%)', 'parts-breakout' ); ?>:
                            <input type="number" name="parts[<?php echo esc_attr( $index ); ?>][top]" value="<?php echo esc_attr( $top ); ?>" min="0" max="100" step="0.1" style="width: 80px;" />
                        </label>
                        <p class="description"><?php esc_html_e( 'Position as percentage from left and top of the main image. You can also drag parts on the frontend when logged in.', 'parts-breakout' ); ?></p>
                    </td>
                </tr>
                <tr>
                    <th><label><?php esc_html_e( 'Line Endpoint', 'parts-breakout' ); ?></label></th>
                    <td>
                        <label>
                            <?php esc_html_e( 'X (%)', 'parts-breakout' ); ?>:
                            <input type="number" name="parts[<?php echo esc_attr( $index ); ?>][line_x]" value="<?php echo esc_attr( $line_x ); ?>" min="0" max="100" step="0.1" style="width: 80px;" />
                        </label>
                        <label style="margin-left: 15px;">
                            <?php esc_html_e( 'Y (%)', 'parts-breakout' ); ?>:
                            <input type="number" name="parts[<?php echo esc_attr( $index ); ?>][line_y]" value="<?php echo esc_attr( $line_y ); ?>" min="0" max="100" step="0.1" style="width: 80px;" />
                        </label>
                        <p class="description"><?php esc_html_e( 'Guideline end-point coordinates as percentage. You can also drag line endpoints on the frontend when logged in.', 'parts-breakout' ); ?></p>
                    </td>
                </tr>
            </table>
        </div>
        <?php
    }

    /**
     * Render below content meta box
     */
    public function render_below_content_meta_box( $post ) {
        wp_nonce_field( 'parts_breakout_below_content', 'parts_breakout_below_content_nonce' );

        $below_content = get_post_meta( $post->ID, '_parts_below_content', true );

        wp_editor( $below_content, 'parts_below_content', [
            'textarea_name' => 'parts_below_content',
            'textarea_rows' => 10,
            'media_buttons' => true,
            'teeny' => false,
        ] );

        echo '<p class="description">' . esc_html__( 'Content to display below the parts breakout section.', 'parts-breakout' ) . '</p>';
    }

    /**
     * Save meta box data
     */
    public function save_meta_boxes( $post_id, $post ) {
        // Check if this is the correct post type
        if ( self::CPT !== $post->post_type ) {
            return;
        }

        // Check autosave
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        // Check permissions
        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        // Save settings
        if ( isset( $_POST['parts_breakout_settings_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['parts_breakout_settings_nonce'] ) ), 'parts_breakout_settings' ) ) {
            if ( isset( $_POST['parts_line_color'] ) ) {
                update_post_meta( $post_id, '_parts_line_color', sanitize_hex_color( wp_unslash( $_POST['parts_line_color'] ) ) );
            }
            if ( isset( $_POST['parts_circle_color'] ) ) {
                update_post_meta( $post_id, '_parts_circle_color', sanitize_hex_color( wp_unslash( $_POST['parts_circle_color'] ) ) );
            }
            if ( isset( $_POST['parts_cta_label'] ) ) {
                update_post_meta( $post_id, '_parts_cta_label', sanitize_text_field( wp_unslash( $_POST['parts_cta_label'] ) ) );
            }
            if ( isset( $_POST['parts_cta_url'] ) ) {
                update_post_meta( $post_id, '_parts_cta_url', esc_url_raw( wp_unslash( $_POST['parts_cta_url'] ) ) );
            }
        }

        // Save parts
        if ( isset( $_POST['parts_breakout_parts_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['parts_breakout_parts_nonce'] ) ), 'parts_breakout_parts' ) ) {
            $parts = [];
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Array elements are sanitized individually below.
            if ( isset( $_POST['parts'] ) && is_array( $_POST['parts'] ) ) {
                $parts_data = map_deep( wp_unslash( $_POST['parts'] ), 'sanitize_text_field' );
                foreach ( $parts_data as $part_data ) {
                    $parts[] = [
                        'image_id' => isset( $part_data['image_id'] ) ? (int) $part_data['image_id'] : 0,
                        'title' => isset( $part_data['title'] ) ? sanitize_text_field( $part_data['title'] ) : '',
                        'content' => isset( $part_data['content'] ) ? wp_kses_post( $part_data['content'] ) : '',
                        'left' => isset( $part_data['left'] ) ? (float) $part_data['left'] : 50,
                        'top' => isset( $part_data['top'] ) ? (float) $part_data['top'] : 50,
                        'line_x' => isset( $part_data['line_x'] ) ? (float) $part_data['line_x'] : '',
                        'line_y' => isset( $part_data['line_y'] ) ? (float) $part_data['line_y'] : '',
                    ];
                }
            }
            update_post_meta( $post_id, '_parts_breakout_parts', $parts );
        }

        // Save below content
        if ( isset( $_POST['parts_breakout_below_content_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['parts_breakout_below_content_nonce'] ) ), 'parts_breakout_below_content' ) ) {
            if ( isset( $_POST['parts_below_content'] ) ) {
                update_post_meta( $post_id, '_parts_below_content', wp_kses_post( wp_unslash( $_POST['parts_below_content'] ) ) );
            }
        }
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts( $hook ) {
        global $post_type;

        if ( ( 'post.php' === $hook || 'post-new.php' === $hook ) && self::CPT === $post_type ) {
            // WordPress color picker
            wp_enqueue_style( 'wp-color-picker' );
            wp_enqueue_script( 'wp-color-picker' );

            // Media uploader
            wp_enqueue_media();

            // Custom admin script
            wp_enqueue_script(
                'parts-breakout-admin',
                plugin_dir_url( __FILE__ ) . 'assets/js/parts-breakout-admin.js',
                [ 'jquery', 'wp-color-picker' ],
                '2.0.0',
                true
            );

            // Custom admin styles
            wp_enqueue_style(
                'parts-breakout-admin',
                plugin_dir_url( __FILE__ ) . 'assets/css/parts-breakout-admin.css',
                [],
                '2.0.0'
            );
        }
    }

    /**
     * Forces the Parts Breakout single template to load from the plugin if theme does not have one.
     *
     * @param string $single The path to the template.
     * @return string
     */
    public function load_single_template( $single ) {
        global $post;
        if ( $post && self::CPT === $post->post_type ) {
            $template = plugin_dir_path( __FILE__ ) . 'templates/single-parts-breakout.php';
            if ( file_exists( $template ) ) {
                return $template;
            }
        }
        return $single;
    }

    /**
     * Enqueue front-end assets.
     */
    public function enqueue_assets() {
        if ( is_singular( self::CPT ) ) {
            $version = '2.0.0';
            wp_enqueue_style( 'parts-breakout', plugin_dir_url( __FILE__ ) . 'assets/css/parts-breakout.css', [], $version );

            // Include jQuery UI Draggable for admin users so they can reposition parts.
            $deps = [ 'jquery' ];
            if ( current_user_can( 'manage_options' ) ) {
                $deps[] = 'jquery-ui-draggable';
                // Media & editor assets for rich text / image selection.
                wp_enqueue_media();
                if ( function_exists( 'wp_enqueue_editor' ) ) {
                    wp_enqueue_editor();
                } else {
                    // Fallback for older WP versions – enqueue wp-editor scripts/styles.
                    wp_enqueue_script( 'wp-editor' );
                    wp_enqueue_style( 'wp-editor' );
                }
            }

            wp_enqueue_script( 'parts-breakout', plugin_dir_url( __FILE__ ) . 'assets/js/parts-breakout.js', $deps, $version, true );

            // Pass data to the front-end script.
            $post_id = get_queried_object_id();
            $line_color = get_post_meta( $post_id, '_parts_line_color', true );
            if ( ! $line_color ) {
                $line_color = '#a92f2e'; // Default color.
            }
            $circle_color = get_post_meta( $post_id, '_parts_circle_color', true );
            if ( ! $circle_color ) {
                $circle_color = '#a92f2e'; // Default color.
            }
            $cta_label = get_post_meta( $post_id, '_parts_cta_label', true );
            if ( ! $cta_label ) {
                $cta_label = 'REQUEST ESTIMATE';
            }
            $cta_url = get_post_meta( $post_id, '_parts_cta_url', true );
            if ( ! $cta_url ) {
                $cta_url = 'https://www.hpsx.com/request-estimate/';
            }
            wp_localize_script( 'parts-breakout', 'partsBreakoutData', [
                'canEdit' => current_user_can( 'manage_options' ),
                'postId'  => $post_id,
                'restUrl'        => esc_url_raw( rest_url( 'parts-breakout/v1/part-position' ) ),
                'restCreateUrl'  => esc_url_raw( rest_url( 'parts-breakout/v1/part-create' ) ),
                'restUpdateUrl'  => esc_url_raw( rest_url( 'parts-breakout/v1/part-update' ) ),
                'nonce'   => wp_create_nonce( 'wp_rest' ),
                'lineColor' => $line_color,
                'circleColor' => $circle_color,
                'ctaLabel' => $cta_label,
                'ctaUrl' => esc_url( $cta_url ),
            ] );
        }
    }

    /**
     * Registers REST routes used by the plugin.
     */
    public function register_rest_routes() {
        register_rest_route( 'parts-breakout/v1', '/part-position', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'update_part_position' ],
            'permission_callback' => function () {
                return current_user_can( 'manage_options' );
            },
            'args'                => [
                'post_id' => [
                    'required' => true,
                    'type'     => 'integer',
                ],
                'index'   => [
                    'required' => true,
                    'type'     => 'integer',
                ],
                // Make positional args optional so the same endpoint can be used for
                // hotspot or guideline updates.
                'left'    => [
                    'required' => false,
                    'type'     => 'number',
                ],
                'top'     => [
                    'required' => false,
                    'type'     => 'number',
                ],
                'line_x'  => [
                    'required' => false,
                    'type'     => 'number',
                ],
                'line_y'  => [
                    'required' => false,
                    'type'     => 'number',
                ],
                'delete' => [
                    'required' => false,
                    'type'     => 'boolean',
                ],
            ],
        ] );

        // Route to create a brand-new part entry.
        register_rest_route( 'parts-breakout/v1', '/part-create', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'create_part' ],
            'permission_callback' => function () {
                return current_user_can( 'manage_options' );
            },
            'args'                => [
                'post_id'    => [ 'required' => true,  'type' => 'integer' ],
                'left'       => [ 'required' => false, 'type' => 'number' ],
                'top'        => [ 'required' => false, 'type' => 'number' ],
                'part_title' => [ 'required' => false, 'type' => 'string' ],
                'content'    => [ 'required' => false, 'type' => 'string' ],
                'image_id'   => [ 'required' => false, 'type' => 'integer' ],
                'line_x'     => [ 'required' => false, 'type' => 'number' ],
                'line_y'     => [ 'required' => false, 'type' => 'number' ],
            ],
        ] );

        // Route to update an existing part.
        register_rest_route( 'parts-breakout/v1', '/part-update', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'update_part' ],
            'permission_callback' => function () {
                return current_user_can( 'manage_options' );
            },
            'args'                => [
                'post_id'    => [ 'required' => true,  'type' => 'integer' ],
                'index'      => [ 'required' => true,  'type' => 'integer' ],
                'part_title' => [ 'required' => false, 'type' => 'string' ],
                'content'    => [ 'required' => false, 'type' => 'string' ],
                'image_id'   => [ 'required' => false, 'type' => 'integer' ],
            ],
        ] );
    }

    /**
     * Handles saving the new hotspot position via REST.
     *
     * @param WP_REST_Request $request The request object.
     *
     * @return WP_REST_Response
     */
    public function update_part_position( \WP_REST_Request $request ) {
        $post_id = (int) $request->get_param( 'post_id' );
        $index   = (int) $request->get_param( 'index' ) - 1; // Zero-based.
        $left    = $request->get_param( 'left' );
        $top     = $request->get_param( 'top' );
        $line_x  = $request->get_param( 'line_x' );
        $line_y  = $request->get_param( 'line_y' );
        $delete  = $request->get_param( 'delete' );

        // Cast only if sent (null indicates param omitted)
        $left   = ( null !== $left )   ? (float) $left   : null;
        $top    = ( null !== $top )    ? (float) $top    : null;
        $line_x = ( null !== $line_x ) ? (float) $line_x : null;
        $line_y = ( null !== $line_y ) ? (float) $line_y : null;
        $delete = ( null !== $delete ) ? (bool) $delete : false;

        if ( $post_id <= 0 || $index < 0 ) {
            return new \WP_REST_Response( [ 'success' => false, 'message' => 'Invalid parameters.' ], 400 );
        }

        $parts = get_post_meta( $post_id, '_parts_breakout_parts', true );
        if ( ! is_array( $parts ) || ! isset( $parts[ $index ] ) ) {
            return new \WP_REST_Response( [ 'success' => false, 'message' => 'Part not found.' ], 404 );
        }

        // Handle deletion separately and early
        if ( $delete ) {
            unset( $parts[ $index ] );
            $parts = array_values( $parts ); // Re-index the array
            update_post_meta( $post_id, '_parts_breakout_parts', $parts );
            return rest_ensure_response( [ 'success' => true, 'deleted' => true ] );
        }

        // Update only the values that were provided in the request.
        if ( null !== $left ) {
            $parts[ $index ]['left'] = $left;
        }
        if ( null !== $top ) {
            $parts[ $index ]['top'] = $top;
        }
        if ( null !== $line_x ) {
            $parts[ $index ]['line_x'] = $line_x;
        }
        if ( null !== $line_y ) {
            $parts[ $index ]['line_y'] = $line_y;
        }

        update_post_meta( $post_id, '_parts_breakout_parts', $parts );

        return rest_ensure_response( [ 'success' => true ] );
    }

    /**
     * Creates a new part via the front-end editor.
     *
     * @param WP_REST_Request $request Request payload.
     *
     * @return WP_REST_Response
     */
    public function create_part( \WP_REST_Request $request ) {
        $post_id    = (int) $request->get_param( 'post_id' );
        $left       = $request->get_param( 'left' );
        $top        = $request->get_param( 'top' );
        $part_title = sanitize_text_field( $request->get_param( 'part_title' ) );
        $content    = $request->get_param( 'content' );
        $image_id   = $request->get_param( 'image_id' );
        $image_id   = ( null !== $image_id ) ? (int) $image_id : 0;
        $line_x     = $request->get_param( 'line_x' );
        $line_y     = $request->get_param( 'line_y' );

        // Default position centre if not provided.
        $left = ( null !== $left ) ? (float) $left : 50.0;
        $top  = ( null !== $top )  ? (float) $top  : 50.0;

        if ( $post_id <= 0 ) {
            return new \WP_REST_Response( [ 'success' => false, 'message' => 'Invalid post.' ], 400 );
        }

        $parts = get_post_meta( $post_id, '_parts_breakout_parts', true );
        if ( ! is_array( $parts ) ) {
            $parts = [];
        }

        $new_part = [
            'image_id'   => $image_id,
            'title'      => $part_title ? $part_title : 'New Part',
            'content'    => $content ? $content : '',
            'left'       => $left,
            'top'        => $top,
            'line_x'     => ( null !== $line_x ) ? (float) $line_x : '',
            'line_y'     => ( null !== $line_y ) ? (float) $line_y : '',
        ];

        $parts[] = $new_part;
        update_post_meta( $post_id, '_parts_breakout_parts', $parts );

        $new_index = count( $parts ); // 1-based for consistency with JS.

        return rest_ensure_response( [ 'success' => true, 'index' => $new_index ] );
    }

    /**
     * Updates an existing part's content via REST.
     *
     * @param WP_REST_Request $request Request payload.
     * @return WP_REST_Response
     */
    public function update_part( \WP_REST_Request $request ) {
        $post_id    = (int) $request->get_param( 'post_id' );
        $index      = (int) $request->get_param( 'index' ) - 1; // zero-based internally

        if ( $post_id <= 0 || $index < 0 ) {
            return new \WP_REST_Response( [ 'success' => false, 'message' => 'Invalid parameters.' ], 400 );
        }

        $parts = get_post_meta( $post_id, '_parts_breakout_parts', true );
        if ( ! is_array( $parts ) || ! isset( $parts[ $index ] ) ) {
            return new \WP_REST_Response( [ 'success' => false, 'message' => 'Part not found.' ], 404 );
        }

        $part_title = $request->get_param( 'part_title' );
        $content    = $request->get_param( 'content' );
        $image_id   = $request->get_param( 'image_id' );

        if ( null !== $part_title ) {
            $parts[ $index ]['title'] = sanitize_text_field( $part_title );
        }
        if ( null !== $content ) {
            $parts[ $index ]['content'] = $content;
        }
        if ( null !== $image_id ) {
            $parts[ $index ]['image_id'] = (int) $image_id;
        }

        update_post_meta( $post_id, '_parts_breakout_parts', $parts );

        return rest_ensure_response( [ 'success' => true ] );
    }
}

new Parts_Breakout_Plugin();
