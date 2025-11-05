=== Parts Breakout ===
Contributors: webfor
Tags: interactive, parts, diagram, hotspots, images
Requires at least: 5.0
Tested up to: 6.8
Stable tag: 2.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Create interactive parts diagrams with clickable hotspots. Showcase machinery parts, product components, or detailed visual breakdowns.

== Description ==

Parts Breakout provides a custom post type that allows you to create interactive image overlays with draggable hotspot markers. Each part can include an image thumbnail, title, rich text description, and precise positioning with visual guideline connectors.

= Features =

* **Custom Post Type** - Dedicated "Parts Breakout" post type with full WordPress editor support
* **Interactive Hotspots** - Click or hover over parts to reveal detailed information
* **Visual Guidelines** - Customizable connecting lines from parts to specific image areas
* **Drag-and-Drop Positioning** - Admin users can reposition parts and guideline endpoints directly on the frontend
* **Rich Content Editor** - Full WYSIWYG editor for each part's description
* **Image Thumbnails** - Add custom images to each part hotspot
* **Customizable Colors** - Configure line and circle colors for each breakout
* **CTA Integration** - Built-in call-to-action button with customizable label and URL
* **Mobile Responsive** - Automatic accordion layout for mobile devices
* **Multiple Breakouts** - Dropdown selector when multiple parts breakouts exist
* **REST API** - Full API support for frontend editing capabilities
* **Translation Ready** - Fully internationalized with text domain support

== Installation ==

1. Upload the `parts-breakout` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to **Parts Breakouts > Add New** to create your first interactive parts diagram

== Frequently Asked Questions ==

= How do I create a parts breakout? =

1. Navigate to **Parts Breakouts > Add New** in your WordPress admin
2. Add a title and optional description
3. Set a **Featured Image** - this will be the main diagram/image
4. Configure the **Breakout Settings** for colors and CTA button
5. Add parts using the **Add Part** button in the Parts meta box

= Can I reposition parts after creating them? =

Yes! When logged in as an administrator, you can drag and drop parts directly on the frontend to reposition them. Changes are saved automatically.

= Does this work on mobile devices? =

Yes! The plugin automatically displays parts in an accordion layout on mobile devices for better usability.

= Can I customize the colors? =

Yes! Each parts breakout has settings for line color and circle color that you can customize using the color picker.

== Screenshots ==

1. Parts Breakout custom post type admin interface
2. Interactive parts hotspots on the frontend
3. Mobile accordion layout
4. Frontend editing with drag-and-drop positioning

== Changelog ==

= 2.0.0 =
* Complete rewrite with modern architecture
* Added frontend drag-and-drop editing
* Implemented REST API endpoints
* Added mobile-responsive accordion layout
* Improved admin interface with repeater fields
* Added customizable colors and CTA settings
* Enhanced security with nonce verification
* Improved performance and code organization

== Upgrade Notice ==

= 2.0.0 =
Major update with new features including frontend editing and mobile responsiveness. Please test on a staging site first.

== Configuration ==

= Creating a Parts Breakout =

1. Navigate to **Parts Breakouts > Add New** in your WordPress admin
2. Add a title and optional description
3. Set a **Featured Image** - this will be the main diagram/image
4. Configure the **Breakout Settings**:
   * Line Color: Color for connecting lines
   * Circle Color: Color for pulsating background circles
   * CTA Button Label: Text for the call-to-action button
   * CTA Button URL: Link destination for the CTA button

= Adding Parts =

In the **Parts** meta box:

1. Click **Add Part** to create a new hotspot
2. For each part, configure:
   * **Part Image**: Thumbnail image that appears in the hotspot
   * **Part Title**: Name of the part
   * **Content**: Rich text description with formatting, links, lists, etc.
   * **Position**: Left/Top percentages (or drag on frontend when logged in)
   * **Line Endpoint**: X/Y coordinates for the guideline destination

= Frontend Editing =

When logged in as an administrator with `manage_options` capability:

1. Visit any Parts Breakout page on the frontend
2. **Drag Hotspots**: Click and drag any part icon to reposition it
3. **Drag Guidelines**: Click and drag the guideline endpoint (white circle) to adjust line placement
4. **Delete Parts**: Click the × button on any part hotspot
5. **Edit Content**: Click the edit icon on tooltips to modify title, content, and image
6. **Add New Parts**: Click the + button in the toolbar to create new parts

All changes save automatically via AJAX to the WordPress REST API.

