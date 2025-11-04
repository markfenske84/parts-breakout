<?php
/**
 * Single Parts Breakout template
 *
 * @package Parts Breakout
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

get_header();

while ( have_posts() ) :
    the_post();

    // Main container styles will be handled by plugin CSS
    $main_image_id = get_post_thumbnail_id();
    if ( ! $main_image_id ) {
        echo '<p>' . esc_html__( 'Please set a featured image for this Parts Breakout.', 'parts-breakout' ) . '</p>';
        continue;
    }

    $main_image_src = wp_get_attachment_image_src( $main_image_id, 'full' );
    if ( ! $main_image_src ) {
        continue;
    }
    ?>
    <article id="post-<?php the_ID(); ?>" <?php post_class( 'parts-breakout-article' ); ?>>
        <header class="entry-header above-parts-content">
            <?php the_title( '<h1 class="entry-title" style="color: #43474d; text-align: center;">', '</h1>' ); ?>

            <?php the_content(); ?>
        </header>

        <div class="entry-content">
            <?php
            // Query all published parts-breakout posts for the dropdown
            $parts_breakout_posts = get_posts([
                'post_type'      => 'parts-breakout',
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'orderby'        => 'title',
                'order'          => 'ASC',
            ]);
            ?>
            <div class="parts-breakout-wrapper">
                <?php if ( count( $parts_breakout_posts ) > 1 ) : ?>
                    <div class="parts-breakout-selector">
                        <label for="parts-breakout-dropdown" class="parts-selector-label">Machine Type:</label>
                        <select id="parts-breakout-dropdown" class="parts-breakout-dropdown">
                            <?php foreach ( $parts_breakout_posts as $pb_post ) : ?>
                                <option value="<?php echo esc_url( get_permalink( $pb_post->ID ) ); ?>" <?php selected( get_the_ID(), $pb_post->ID ); ?>>
                                    <?php echo esc_html( $pb_post->post_title ); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                <?php endif; ?>
                <img class="parts-breakout-main-image" src="<?php echo esc_url( $main_image_src[0] ); ?>" alt="<?php the_title_attribute(); ?>" />

                <?php
                $parts = get_post_meta( get_the_ID(), '_parts_breakout_parts', true );
                if ( is_array( $parts ) && ! empty( $parts ) ) :
                    foreach ( $parts as $index => $part ) :
                        $part_image_id = isset( $part['image_id'] ) ? (int) $part['image_id'] : 0;
                        $left          = isset( $part['left'] ) ? (float) $part['left'] : 50;
                        $top           = isset( $part['top'] ) ? (float) $part['top'] : 50;
                        $line_x        = isset( $part['line_x'] ) ? $part['line_x'] : '';
                        $line_y        = isset( $part['line_y'] ) ? $part['line_y'] : '';
                        $part_title    = isset( $part['title'] ) ? $part['title'] : '';
                        $content       = isset( $part['content'] ) ? $part['content'] : '';

                        // Display index as 1-based for consistency
                        $display_index = $index + 1;

                        // Fallback content if image missing
                        $icon_html = '<span class="part-hotspot-icon">+</span>';
                        if ( $part_image_id ) {
                            $icon_html = wp_get_attachment_image( $part_image_id, 'medium', false, [ 'class' => 'part-hotspot-image' ] );
                        }
                        ?>
                        <div class="part-hotspot" style="left: <?php echo esc_attr( $left ); ?>%; top: <?php echo esc_attr( $top ); ?>%;" data-index="<?php echo esc_attr( $display_index ); ?>" data-line-x="<?php echo esc_attr( $line_x ); ?>" data-line-y="<?php echo esc_attr( $line_y ); ?>">
                            <?php echo $icon_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                            <div class="part-tooltip">
                                <div class="part-tooltip-inner">
                                    <?php
                                    if ( $part_title ) {
                                        echo '<h3 class="part-tooltip-title">' . esc_html( $part_title ) . '</h3>';
                                    }
                                    echo wp_kses_post( $content );
                                    ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>

            <?php
            /* Mobile layout: list each part below main image */
            if ( is_array( $parts ) && ! empty( $parts ) ) : ?>
                <div class="parts-mobile-list">
                    <?php
                    foreach ( $parts as $part ) :
                        $part_image_id = isset( $part['image_id'] ) ? (int) $part['image_id'] : 0;
                        $part_title    = isset( $part['title'] ) ? $part['title'] : '';
                        $content       = isset( $part['content'] ) ? $part['content'] : '';
                        ?>
                        <div class="part-mobile-block">
                            <button class="part-accordion-toggle" aria-expanded="false">
                                <?php
                                if ( $part_image_id ) {
                                    echo wp_get_attachment_image( $part_image_id, 'medium', false, [ 'class' => 'part-mobile-image' ] );
                                }

                                if ( $part_title ) {
                                    echo '<span class="part-mobile-title">' . esc_html( $part_title ) . '</span>';
                                }
                                echo '<span class="part-learn-more">Learn more</span>';
                                ?>
                            </button>
                            <div class="part-accordion-content" hidden>
                                <?php echo wp_kses_post( $content ); ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php
            $below_parts_content = get_post_meta( get_the_ID(), '_parts_below_content', true );
            if ( $below_parts_content ) : ?>
                <div class="below-parts-content">
                    <?php echo wp_kses_post( $below_parts_content ); ?>
                </div>
            <?php endif; ?>

        </div>
    </article>
<?php
endwhile; // End of the loop.

get_footer();
