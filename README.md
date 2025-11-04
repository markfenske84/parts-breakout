# Parts Breakout

A WordPress plugin that creates interactive parts diagrams with clickable hotspots. Perfect for showcasing machinery parts, product components, or any detailed visual breakdown where users can click on specific areas to learn more.

## Overview

Parts Breakout provides a custom post type that allows you to create interactive image overlays with draggable hotspot markers. Each part can include an image thumbnail, title, rich text description, and precise positioning with visual guideline connectors. The plugin includes both desktop hover interactions and mobile-friendly accordion layouts.

## Features

- **Custom Post Type** - Dedicated "Parts Breakout" post type with full WordPress editor support
- **Interactive Hotspots** - Click or hover over parts to reveal detailed information
- **Visual Guidelines** - Customizable connecting lines from parts to specific image areas
- **Drag-and-Drop Positioning** - Admin users can reposition parts and guideline endpoints directly on the frontend
- **Rich Content Editor** - Full WYSIWYG editor for each part's description
- **Image Thumbnails** - Add custom images to each part hotspot
- **Customizable Colors** - Configure line and circle colors for each breakout
- **CTA Integration** - Built-in call-to-action button with customizable label and URL
- **Mobile Responsive** - Automatic accordion layout for mobile devices
- **Multiple Breakouts** - Dropdown selector when multiple parts breakouts exist
- **REST API** - Full API support for frontend editing capabilities
- **Auto-Updates** - GitHub-based automatic plugin updates
- **Translation Ready** - Fully internationalized with text domain support

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- jQuery (included with WordPress)
- jQuery UI Draggable (for admin repositioning)

## Installation

### Via Composer (Recommended)

1. Add the plugin repository to your `composer.json`:
```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/markfenske84/parts-breakout"
    }
  ],
  "require": {
    "webfor/parts-breakout": "^2.0"
  }
}
```

2. Run `composer install` or `composer update`

### Manual Installation

1. Download the plugin files
2. Upload the `parts-breakout` folder to `/wp-content/plugins/`
3. Run `composer install` in the plugin directory to install dependencies
4. Activate the plugin through the 'Plugins' menu in WordPress

## Configuration

### Creating a Parts Breakout

1. Navigate to **Parts Breakouts > Add New** in your WordPress admin
2. Add a title and optional description
3. Set a **Featured Image** - this will be the main diagram/image
4. Configure the **Breakout Settings**:
   - Line Color: Color for connecting lines
   - Circle Color: Color for pulsating background circles
   - CTA Button Label: Text for the call-to-action button
   - CTA Button URL: Link destination for the CTA button

### Adding Parts

In the **Parts** meta box:

1. Click **Add Part** to create a new hotspot
2. For each part, configure:
   - **Part Image**: Thumbnail image that appears in the hotspot
   - **Part Title**: Name of the part
   - **Content**: Rich text description with formatting, links, lists, etc.
   - **Position**: Left/Top percentages (or drag on frontend when logged in)
   - **Line Endpoint**: X/Y coordinates for the guideline destination

### Below Parts Content

Use the **Below Parts Content** editor to add additional information that appears after the interactive breakout section.

## Usage

### Frontend Display

- **Desktop**: Hover over or click part hotspots to reveal tooltips with detailed information
- **Mobile**: Parts display as an accordion list below the main image
- **Multiple Breakouts**: If multiple parts breakouts exist, a dropdown selector appears at the top

### Admin Editing on Frontend

When logged in as an administrator with `manage_options` capability:

1. Visit any Parts Breakout page on the frontend
2. **Drag Hotspots**: Click and drag any part icon to reposition it
3. **Drag Guidelines**: Click and drag the guideline endpoint (white circle) to adjust line placement
4. **Delete Parts**: Click the × button on any part hotspot
5. **Edit Content**: Click the edit icon on tooltips to modify title, content, and image
6. **Add New Parts**: Click the + button in the toolbar to create new parts

All changes save automatically via AJAX to the WordPress REST API.

## Template Structure

The plugin includes a single template:

```
templates/
  └── single-parts-breakout.php
```

This template is automatically loaded for all Parts Breakout posts. To customize:

1. Copy `single-parts-breakout.php` to your theme directory
2. Modify as needed - your theme version will take precedence

## Shortcodes

Currently, the plugin does not include shortcode support. Parts Breakouts are designed to be standalone posts accessed via their permalink. If shortcode functionality is needed, it can be added via custom development.

## REST API Endpoints

The plugin registers the following REST API endpoints:

### Update Part Position
```
POST /wp-json/parts-breakout/v1/part-position
```
Parameters: `post_id`, `index`, `left`, `top`, `line_x`, `line_y`, `delete`

### Create New Part
```
POST /wp-json/parts-breakout/v1/part-create
```
Parameters: `post_id`, `left`, `top`, `part_title`, `content`, `image_id`, `line_x`, `line_y`

### Update Part Content
```
POST /wp-json/parts-breakout/v1/part-update
```
Parameters: `post_id`, `index`, `part_title`, `content`, `image_id`

All endpoints require `manage_options` capability and are nonce-protected.

## Styling

The plugin includes two CSS files:

- `assets/css/parts-breakout.css` - Frontend styles
- `assets/css/parts-breakout-admin.css` - Admin interface styles

To customize the appearance, you can:

1. Override CSS in your theme's stylesheet
2. Enqueue a custom stylesheet with higher priority
3. Modify the plugin CSS files directly (will be overwritten on updates)

Key CSS classes:
- `.parts-breakout-wrapper` - Main container
- `.parts-breakout-main-image` - The featured image
- `.part-hotspot` - Individual part marker
- `.part-tooltip` - Hover tooltip content
- `.parts-mobile-list` - Mobile accordion container

## JavaScript

Frontend JavaScript is located in `assets/js/parts-breakout.js` and handles:

- Tooltip interactions
- Mobile accordion toggles
- Admin drag-and-drop positioning
- REST API communications
- Dynamic guideline rendering with Canvas API
- Frontend editing interface

Admin JavaScript is in `assets/js/parts-breakout-admin.js` and manages:

- Meta box repeater fields
- WordPress media library integration
- Color picker initialization
- Part row add/remove functionality

## Updates

The plugin uses [Plugin Update Checker](https://github.com/YahnisElsts/plugin-update-checker) to deliver automatic updates from GitHub.

To configure updates:

1. Edit `parts-breakout.php`
2. Update the `setup_updater()` method with your GitHub repository URL
3. Set the appropriate branch (default: `main`)

Updates will appear in the WordPress admin alongside core and plugin updates.

## Data Storage

Parts Breakout uses WordPress post meta to store configuration:

- `_parts_breakout_parts` - Array of all parts with their settings
- `_parts_line_color` - Guideline color
- `_parts_circle_color` - Background circle color
- `_parts_cta_label` - CTA button text
- `_parts_cta_url` - CTA button link
- `_parts_below_content` - Additional content below breakout

All meta is stored serialized in the database and properly sanitized on save.

## Hooks & Filters

The plugin currently doesn't expose specific hooks or filters. To extend functionality, you can:

1. Hook into WordPress core actions like `save_post`, `rest_api_init`, etc.
2. Filter template output using standard WordPress template hierarchy
3. Modify the plugin class directly for custom needs

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 12+, Chrome for Android

The interactive canvas features require HTML5 Canvas support (available in all modern browsers).

## Troubleshooting

**Parts not appearing on frontend:**
- Verify featured image is set
- Check that parts have been added in the meta box
- Ensure JavaScript is not blocked or erroring (check browser console)

**Drag-and-drop not working:**
- Confirm you're logged in as administrator
- Check that jQuery UI Draggable is loading (inspect Network tab)
- Verify `manage_options` capability on your user account

**Updates not showing:**
- Confirm GitHub repository URL is correct in `setup_updater()`
- Check that Plugin Update Checker library is loaded
- Verify GitHub repository is public or access token is configured

**Styles not applying:**
- Clear browser and WordPress caches
- Check for CSS conflicts with theme
- Verify plugin CSS files are enqueued (inspect page source)

## Contributing

This plugin is maintained by Webfor. For bug reports, feature requests, or contributions:

1. Create an issue in the GitHub repository
2. Submit pull requests for review
3. Follow WordPress coding standards
4. Test thoroughly before submitting

## License

This plugin is proprietary software developed by Webfor for client use. Redistribution and modification rights are reserved.

## Credits

- Developed by: Webfor
- Plugin Update Checker: [Yahnis Elsts](https://github.com/YahnisElsts/plugin-update-checker)
- Version: 2.0.0

## Changelog

### 2.0.0
- Complete rewrite with modern architecture
- Added frontend drag-and-drop editing
- Implemented REST API endpoints
- Added mobile-responsive accordion layout
- Improved admin interface with repeater fields
- Added customizable colors and CTA settings
- Integrated automatic GitHub updates
- Enhanced security with nonce verification
- Improved performance and code organization

---

For support or questions, contact Webfor or visit the plugin repository.
