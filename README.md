# Parts Breakout

A powerful WordPress plugin for creating interactive parts diagrams with clickable hotspots. Perfect for showcasing machinery parts, product components, or any detailed visual breakdown where users can explore different elements.

![WordPress Version](https://img.shields.io/badge/WordPress-5.0%2B-blue)
![PHP Version](https://img.shields.io/badge/PHP-7.4%2B-purple)
![License](https://img.shields.io/badge/License-GPLv2%2B-green)
![Version](https://img.shields.io/badge/Version-2.0.1-orange)

## Features

- **Custom Post Type** - Dedicated "Parts Breakout" post type with full WordPress editor support
- **Interactive Hotspots** - Click or hover over parts to reveal detailed information with smooth animations
- **Visual Guidelines** - Customizable connecting lines from parts to specific image areas
- **Drag-and-Drop Positioning** - Admin users can reposition parts and guideline endpoints directly on the frontend
- **Rich Content Editor** - Full WYSIWYG editor for each part's description with media support
- **Image Thumbnails** - Add custom images to each part hotspot
- **Customizable Colors** - Configure line and circle colors for each breakout using color picker
- **CTA Integration** - Built-in call-to-action button with customizable label and URL
- **Mobile Responsive** - Automatic accordion layout for mobile devices
- **Multiple Breakouts** - Dropdown selector when multiple parts breakouts exist on a page
- **REST API** - Full API support for frontend editing capabilities
- **Auto-Updates** - GitHub-based automatic plugin updates (for direct installations)
- **Translation Ready** - Fully internationalized with `parts-breakout` text domain
- **Security First** - Nonce verification, capability checks, and proper data sanitization

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- jQuery (included with WordPress)
- jQuery UI Draggable (for admin repositioning features)

## Installation

### Option 1: WordPress.org (Recommended)

1. Log in to your WordPress admin panel
2. Navigate to **Plugins > Add New**
3. Search for "Parts Breakout"
4. Click **Install Now** and then **Activate**

### Option 2: Manual Installation

1. Download the latest release from this repository
2. Upload the `parts-breakout` folder to `/wp-content/plugins/`
3. Activate the plugin through the 'Plugins' menu in WordPress

### Option 3: Composer

```bash
composer require webfor/parts-breakout
```

## Quick Start

1. Navigate to **Parts Breakouts > Add New** in WordPress admin
2. Add a title for your parts diagram
3. Set a **Featured Image** (this will be your main diagram/image)
4. Configure **Breakout Settings**:
   - Line Color
   - Circle Color
   - CTA Button Label & URL
5. Add parts using the **Add Part** button
6. For each part, set:
   - Part image/thumbnail
   - Title
   - Description (with rich text formatting)
   - Position (or drag on frontend)
7. Publish and view on the frontend

## Usage

### Creating a Parts Breakout

Navigate to **Parts Breakouts > Add New** and configure:

**Breakout Settings**
- **Line Color**: Color for connecting lines between parts and image areas
- **Circle Color**: Color for pulsating background circles behind hotspots
- **CTA Button Label**: Text for the call-to-action button (e.g., "Request Estimate")
- **CTA Button URL**: Link destination for the CTA button

**Adding Parts**

Each part includes:
- **Part Image**: Thumbnail displayed in the hotspot marker
- **Part Title**: Name/heading for the part
- **Content**: Rich text description with formatting, links, lists, media
- **Position**: Left/Top percentages from the main image edges
- **Line Endpoint**: X/Y coordinates where the guideline connects to the main image

**Below Parts Content**

Optional content section that appears below the interactive diagram.

### Frontend Editing

When logged in as an administrator with `manage_options` capability:

**Drag Hotspots**
- Click and drag any part icon to reposition it
- Changes save automatically via AJAX

**Drag Guidelines**
- Click and drag the guideline endpoint (white circle) to adjust line placement
- Perfect for fine-tuning the visual connection between part and image area

**Delete Parts**
- Click the × button on any part hotspot to remove it

**Edit Content**
- Click the edit icon on tooltips to modify title, content, and image inline
- Rich text editor appears for content editing

**Add New Parts**
- Click the + button in the frontend toolbar to create new parts on the fly

All changes save automatically to the WordPress database via the REST API.

### Display Modes

**Desktop**
- Hover over or click part hotspots to reveal tooltips with detailed information
- Smooth animations and visual feedback
- Canvas-based guideline rendering

**Mobile**
- Parts automatically display as an accordion list below the main image
- Touch-friendly interface
- Collapsible sections for each part

**Multiple Breakouts**
- If multiple parts breakouts exist, a dropdown selector appears automatically
- Users can switch between different diagrams seamlessly

## REST API Endpoints

The plugin exposes three REST API endpoints (requires `manage_options` capability):

### Update Part Position

```
POST /wp-json/parts-breakout/v1/part-position
```

**Parameters:**
- `post_id` (int, required): Post ID
- `index` (int, required): Part index
- `left` (float, optional): Left position percentage
- `top` (float, optional): Top position percentage
- `line_x` (float, optional): Line X coordinate
- `line_y` (float, optional): Line Y coordinate
- `delete` (bool, optional): Delete the part

### Create New Part

```
POST /wp-json/parts-breakout/v1/part-create
```

**Parameters:**
- `post_id` (int, required): Post ID
- `left` (float, optional): Left position percentage
- `top` (float, optional): Top position percentage
- `part_title` (string, optional): Part title
- `content` (string, optional): Part content (HTML)
- `image_id` (int, optional): Attachment ID for part image
- `line_x` (float, optional): Line X coordinate
- `line_y` (float, optional): Line Y coordinate

### Update Part Content

```
POST /wp-json/parts-breakout/v1/part-update
```

**Parameters:**
- `post_id` (int, required): Post ID
- `index` (int, required): Part index
- `part_title` (string, optional): Updated title
- `content` (string, optional): Updated content (HTML)
- `image_id` (int, optional): Updated attachment ID

All endpoints are nonce-protected using `wp_rest` nonce.

## Customization

### Template Override

To customize the single parts breakout template:

1. Copy `templates/single-parts-breakout.php` to your theme directory
2. Modify as needed - your theme version takes precedence

### CSS Customization

Override styles in your theme's CSS:

```css
/* Main container */
.parts-breakout-wrapper {
    /* Your styles */
}

/* Main diagram image */
.parts-breakout-main-image {
    /* Your styles */
}

/* Part hotspot markers */
.part-hotspot {
    /* Your styles */
}

/* Tooltips */
.part-tooltip {
    /* Your styles */
}

/* Mobile accordion */
.parts-mobile-list {
    /* Your styles */
}
```

### Hooks & Filters

Currently, the plugin doesn't expose custom hooks. To extend functionality, you can:

1. Hook into WordPress core actions: `save_post`, `rest_api_init`, etc.
2. Use template hierarchy to override templates
3. Enqueue custom scripts/styles with higher priority

## Development

### File Structure

```
parts-breakout/
├── assets/
│   ├── css/
│   │   ├── parts-breakout.css           # Frontend styles
│   │   └── parts-breakout-admin.css     # Admin styles
│   └── js/
│       ├── parts-breakout.js            # Frontend JavaScript
│       └── parts-breakout-admin.js      # Admin JavaScript
├── templates/
│   └── single-parts-breakout.php        # Single post template
├── plugin-update-checker/               # Update checker library
├── parts-breakout.php                   # Main plugin file
├── readme.txt                           # WordPress.org readme
├── .distignore                          # Files to exclude from WP.org
└── README.md                            # This file
```

### Building for WordPress.org

The `.distignore` file automatically excludes files not needed for WordPress.org:

- `plugin-update-checker/` directory
- Development files (`.git`, `node_modules`, etc.)
- `README.md` (uses `readme.txt` instead)

Simply use the WordPress.org SVN deployment process, and the build system will respect the `.distignore` file.

### Building for Direct Installation

For direct installations that support GitHub updates:

1. Include all files including `plugin-update-checker/`
2. Zip the entire plugin directory
3. Upload via WordPress admin or FTP

The update checker will automatically initialize and check for updates from this GitHub repository.

### Disabling Auto-Updates

To disable automatic updates, add this to your `wp-config.php`:

```php
define( 'PARTS_BREAKOUT_DISABLE_UPDATES', true );
```

Or remove the `plugin-update-checker/` directory entirely.

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 12+, Chrome for Android

Canvas API support required for guideline rendering (available in all modern browsers).

## Troubleshooting

**Parts not appearing on frontend**
- Verify featured image is set on the post
- Check that parts have been added in the meta box
- Open browser console and check for JavaScript errors

**Drag-and-drop not working**
- Confirm you're logged in as administrator
- Verify you have `manage_options` capability
- Check that jQuery UI Draggable is loading (Network tab)

**Updates not showing**
- Confirm `plugin-update-checker/` directory exists
- Verify GitHub repository URL is correct
- Check that repository is public or access token configured

**Styles not applying**
- Clear browser cache and WordPress object cache
- Check for CSS conflicts with theme (browser inspector)
- Verify plugin CSS files are enqueued (view page source)

## Contributing

We welcome contributions! Please:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Follow WordPress coding standards and test thoroughly before submitting.

## Changelog

### 2.0.1 - Latest
- Fixed all WordPress.org Plugin Check errors and warnings
- Added proper input sanitization and security improvements
- Added GPL v2 license headers for WordPress.org compliance
- Updated to WordPress 6.8 compatibility
- Improved readme.txt formatting and documentation
- Created comprehensive README.md for GitHub
- Added .distignore for WordPress.org builds

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

## License

This plugin is licensed under the GNU General Public License v2 or later.

```
Parts Breakout - Interactive Parts Diagrams for WordPress
Copyright (C) 2025 Webfor

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
```

## Credits

- **Developed by**: [Webfor](https://webfor.com)
- **Plugin Update Checker**: [Yahnis Elsts](https://github.com/YahnisElsts/plugin-update-checker)
- **Version**: 2.0.1

## Support

For support, bug reports, or feature requests:

- Open an issue on [GitHub](https://github.com/markfenske84/parts-breakout/issues)
- Contact Webfor for professional support

---

Made with ❤️ by [Webfor](https://webfor.com)

