# Parts Breakout Plugin - Version 2.0 Upgrade Notes

## What's Changed

The plugin has been **completely rewritten** to remove the ACF (Advanced Custom Fields) dependency. It now uses **native WordPress** functionality:

- ✅ Native WordPress meta boxes
- ✅ Native WordPress color picker with **custom color palette**
- ✅ Native WordPress media uploader
- ✅ Native WordPress editor
- ✅ Works on any WordPress site without requiring ACF

## Custom Color Palette

The color pickers now include your custom brand colors:
- `#a92f2e` (Red/Maroon) - **Default**
- `#34488d` (Blue)
- `#effbff` (Light Cyan)
- `#112243` (Dark Navy)
- `#000000` (Black)
- `#ffffff` (White)

## Default CTA URL

The CTA Button URL field now defaults to `https://www.hpsx.com/request-estimate/` for convenience.

## Enhanced Media Library

The Content field for each part now includes a full **"Add Media"** button that opens the complete WordPress media library, making it easy to:
- Upload new images
- Select from existing media
- Edit image settings
- Insert images into content

This replaces the basic image insertion dialog with the full-featured WordPress media manager you're already familiar with.

## Migrating Existing Data

If you have existing Parts Breakout posts that were created with ACF:

### Option 1: Automatic Migration (Recommended)

1. Keep ACF active temporarily
2. Visit: `yoursite.com/wp-content/plugins/parts-breakout/migrate-from-acf.php?parts_breakout_migrate=1`
3. Wait for migration to complete
4. Verify your posts still display correctly
5. You can now deactivate/remove ACF
6. Delete the `migrate-from-acf.php` file

### Option 2: Fresh Start

If you don't have important existing data:
1. Simply deactivate ACF
2. Edit your Parts Breakout posts - the new meta boxes will appear
3. Re-enter your data using the new interface

## New Admin Interface

When editing a Parts Breakout post, you'll see three meta boxes:

### 1. Breakout Settings
- **Line Color** - Color for connecting lines (with custom palette)
- **Circle Color** - Color for pulsating circles (with custom palette)
- **CTA Button Label** - Call-to-action button text
- **CTA Button URL** - Where the CTA button links to

### 2. Parts
- Add/remove parts with the "Add Part" button
- Each part has:
  - Part Image (click "Select Image" to choose)
  - Part Title
  - Content (text area)
  - Position (Left % and Top %)
  - Line Endpoint (X % and Y %)
- Parts can be reordered by dragging (if jQuery UI is available)
- Remove parts with the "Remove" button

### 3. Below Parts Content
- Rich text editor for content displayed below the parts section

## Frontend Editing

The frontend editing capabilities remain unchanged:
- Logged-in admins can still drag parts to reposition them
- Logged-in admins can still drag line endpoints
- All changes save automatically via REST API

## Data Storage

All data is now stored in WordPress post meta:
- `_parts_line_color` - Line color hex value
- `_parts_circle_color` - Circle color hex value
- `_parts_cta_label` - CTA button label
- `_parts_cta_url` - CTA button URL
- `_parts_breakout_parts` - Array of all parts data
- `_parts_below_content` - Content below parts section

## Compatibility

- **WordPress**: 5.0+
- **PHP**: 7.0+
- **ACF**: No longer required (optional for migration only)

## Benefits of This Update

1. **Portability** - Use on any WordPress site without plugin dependencies
2. **Performance** - Lighter weight without ACF overhead
3. **Maintenance** - One less plugin to maintain and update
4. **Customization** - Full control over the color picker palette
5. **Simplicity** - Native WordPress UI that editors already know

## Troubleshooting

### Color picker not showing custom colors
- Make sure you've saved the post at least once after upgrading
- Clear browser cache
- Try a different browser

### Parts not appearing on frontend
- Check that you've added parts in the "Parts" meta box
- Verify the featured image is set for the post
- Check that parts have valid position values (0-100)

### Migration script not working
- Ensure ACF is still active
- Verify you're logged in as an administrator
- Check PHP error logs for specific errors

## Support

If you encounter any issues with the upgrade, you can:
1. Check the browser console for JavaScript errors
2. Check WordPress debug log for PHP errors
3. Temporarily revert to the previous version if needed (backup your database first)

## Version History

- **v2.0.0** - Complete rewrite to remove ACF dependency, custom color palette support
- **v1.0.0** - Initial version with ACF dependency

