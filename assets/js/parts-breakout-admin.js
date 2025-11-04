jQuery(document).ready(function($) {
    'use strict';

    // Initialize color pickers with custom palette
    $('.parts-color-picker').wpColorPicker({
        palettes: ['#a92f2e', '#34488d', '#effbff', '#112243', '#000000', '#ffffff']
    });

    let partIndex = $('#parts-list .part-row').length;

    // Add new part
    $('#add-part-btn').on('click', function(e) {
        e.preventDefault();
        
        const template = $('#part-row-template').html();
        const newRow = template
            .replace(/\{\{INDEX\}\}/g, partIndex)
            .replace(/\{\{NUMBER\}\}/g, partIndex + 1);
        
        $('#parts-list').append(newRow);
        
        // Initialize TinyMCE for the new content field
        const editorId = 'part_content_' + partIndex;
        const textareaName = 'parts[' + partIndex + '][content]';
        
        // Replace the textarea with wp_editor
        const $textarea = $('#parts-list .part-row:last-child .part-content-field');
        $textarea.attr('id', editorId);
        $textarea.attr('name', textareaName);
        $textarea.addClass('wp-editor-area');
        
        // Initialize WordPress editor with a small delay to ensure DOM is ready
        setTimeout(function() {
            if (typeof wp !== 'undefined' && wp.editor && typeof tinymce !== 'undefined') {
                wp.editor.initialize(editorId, {
                    tinymce: {
                        wpautop: true,
                        plugins: 'lists,link,wordpress,wplink,wpdialogs',
                        toolbar1: 'formatselect,bold,italic,underline,bullist,numlist,link,unlink',
                        toolbar2: '',
                        setup: function(editor) {
                            editor.on('init', function() {
                                console.log('TinyMCE editor initialized for: ' + editorId);
                            });
                        }
                    },
                    quicktags: true,
                    mediaButtons: true
                });
            } else {
                console.error('WordPress editor or TinyMCE not available for: ' + editorId);
            }
        }, 100);
        
        partIndex++;
        
        // Renumber all parts
        updatePartNumbers();
    });

    // Remove part
    $(document).on('click', '.remove-part-btn', function(e) {
        e.preventDefault();
        
        if (confirm('Are you sure you want to remove this part?')) {
            const $row = $(this).closest('.part-row');
            
            // Remove TinyMCE editor instance if it exists
            const $editor = $row.find('.wp-editor-area');
            if ($editor.length && typeof wp !== 'undefined' && wp.editor) {
                const editorId = $editor.attr('id');
                if (editorId) {
                    wp.editor.remove(editorId);
                }
            }
            
            $row.remove();
            updatePartNumbers();
        }
    });

    // Select part image
    $(document).on('click', '.select-part-image', function(e) {
        e.preventDefault();
        
        const button = $(this);
        const row = button.closest('.part-row');
        const imageIdInput = row.find('.part-image-id');
        const preview = row.find('.part-image-preview');
        
        const frame = wp.media({
            title: 'Select Part Image',
            button: { text: 'Use this image' },
            multiple: false,
            library: { type: 'image' }
        });
        
        frame.on('select', function() {
            const attachment = frame.state().get('selection').first().toJSON();
            imageIdInput.val(attachment.id);
            
            const imgHtml = '<img src="' + attachment.url + '" alt="" style="max-width: 80px; max-height: 80px;" />';
            preview.html(imgHtml);
            
            // Show remove button
            if (button.siblings('.remove-part-image').length === 0) {
                button.after('<button type="button" class="button remove-part-image">Remove Image</button>');
            }
        });
        
        frame.open();
    });

    // Remove part image
    $(document).on('click', '.remove-part-image', function(e) {
        e.preventDefault();
        
        const row = $(this).closest('.part-row');
        row.find('.part-image-id').val('');
        row.find('.part-image-preview').empty();
        $(this).remove();
    });

    // Update part numbers
    function updatePartNumbers() {
        $('#parts-list .part-row').each(function(index) {
            $(this).find('.part-number').text(index + 1);
            
            // Update all input names to have sequential indices
            const oldIndex = $(this).data('index');
            if (oldIndex !== index) {
                $(this).data('index', index);
                $(this).find('input, textarea, select').each(function() {
                    const name = $(this).attr('name');
                    if (name) {
                        const newName = name.replace(/parts\[\d+\]/, 'parts[' + index + ']');
                        $(this).attr('name', newName);
                    }
                });
            }
        });
    }

    // Make parts sortable (optional enhancement)
    if ($.fn.sortable) {
        $('#parts-list').sortable({
            handle: '.part-row-header h4',
            axis: 'y',
            update: function() {
                updatePartNumbers();
            }
        });
    }
});

