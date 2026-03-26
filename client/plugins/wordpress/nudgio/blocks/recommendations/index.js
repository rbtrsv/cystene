/**
 * Nudgio Technologies — Gutenberg Block (Editor Script)
 *
 * Vanilla JS using wp.element.createElement() — no build process, no JSX.
 * Registers the nudgio/recommendations block with:
 *   - InspectorControls sidebar (10 panels: Algorithm, 8 visual groups, Type-Specific)
 *   - Placeholder preview in the main editor area
 *
 * All WordPress packages accessed via globals (wp.blocks, wp.blockEditor, wp.components, wp.element, wp.i18n).
 */
( function () {
    'use strict';

    var el             = wp.element.createElement;
    var registerBlock  = wp.blocks.registerBlockType;
    var useBlockProps  = wp.blockEditor.useBlockProps;
    var InspectorControls = wp.blockEditor.InspectorControls;
    var PanelColorSettings = wp.blockEditor.PanelColorSettings;
    var Fragment       = wp.element.Fragment;
    var __             = wp.i18n.__;

    // wp.components
    var PanelBody      = wp.components.PanelBody;
    var SelectControl  = wp.components.SelectControl;
    var RangeControl   = wp.components.RangeControl;
    var TextControl    = wp.components.TextControl;
    var ToggleControl  = wp.components.ToggleControl;
    var Placeholder    = wp.components.Placeholder;

    // ==========================================
    // Conditional Control Visibility Map
    // ==========================================

    // Which fields are visible for each recommendation type
    var typeVisibility = {
        bestsellers:  { product_id: false, lookback_days: true,  method: true,  min_price_increase_percent: false },
        'cross-sell': { product_id: true,  lookback_days: true,  method: false, min_price_increase_percent: false },
        upsell:       { product_id: true,  lookback_days: false, method: false, min_price_increase_percent: true  },
        similar:      { product_id: true,  lookback_days: false, method: false, min_price_increase_percent: false },
    };

    // Whether the "Type-Specific Settings" panel should be shown at all
    function hasTypeSpecificSettings( type ) {
        var vis = typeVisibility[ type ];
        return vis && ( vis.lookback_days || vis.method || vis.min_price_increase_percent );
    }

    // ==========================================
    // Label Maps
    // ==========================================

    var typeLabels = {
        bestsellers:  'Bestsellers',
        'cross-sell': 'Cross-sell',
        upsell:       'Upsell',
        similar:      'Similar',
    };

    var styleLabels = {
        grid:     'Grid',
        carousel: 'Carousel',
    };

    // ==========================================
    // Color Swatch Component
    // ==========================================

    /**
     * Renders a small color circle with a label underneath.
     * Used in the Placeholder preview to show the current color settings.
     */
    function ColorSwatch( props ) {
        return el( 'span', { style: { textAlign: 'center', marginRight: '12px' } },
            el( 'span', {
                style: {
                    display:      'inline-block',
                    width:        '20px',
                    height:       '20px',
                    borderRadius: '50%',
                    backgroundColor: props.color,
                    border:       '1px solid #ccc',
                    verticalAlign: 'middle',
                },
            } ),
            el( 'span', {
                style: { display: 'block', fontSize: '10px', color: '#757575', marginTop: '2px' },
            }, props.label )
        );
    }

    // ==========================================
    // Block Registration
    // ==========================================

    registerBlock( 'nudgio/recommendations', {

        // edit() — renders the block in the editor
        edit: function ( props ) {
            var attributes    = props.attributes;
            var setAttributes = props.setAttributes;
            var blockProps    = useBlockProps();

            var type          = attributes.type;
            var vis           = typeVisibility[ type ] || typeVisibility.bestsellers;

            // ------------------------------------------
            // Panel 1: Widget Settings (type + count + product_id)
            // ------------------------------------------
            var widgetSettingsPanel = el( PanelBody, { title: __( 'Widget Settings', 'nudgio' ), initialOpen: true },

                // Type dropdown
                el( SelectControl, {
                    label: __( 'Recommendation Type', 'nudgio' ),
                    value: type,
                    options: [
                        { label: 'Bestsellers',  value: 'bestsellers' },
                        { label: 'Cross-sell',    value: 'cross-sell' },
                        { label: 'Upsell',        value: 'upsell' },
                        { label: 'Similar',       value: 'similar' },
                    ],
                    onChange: function ( val ) { setAttributes( { type: val } ); },
                } ),

                // Count slider
                el( RangeControl, {
                    label: __( 'Number of Products', 'nudgio' ),
                    value: attributes.count,
                    onChange: function ( val ) { setAttributes( { count: val } ); },
                    min: 1,
                    max: 20,
                } ),

                // Product ID — shown only for cross-sell, upsell, similar
                vis.product_id ? el( TextControl, {
                    label: __( 'Product ID', 'nudgio' ),
                    help: __( 'Leave empty to auto-detect on product pages.', 'nudgio' ),
                    value: attributes.product_id,
                    onChange: function ( val ) { setAttributes( { product_id: val } ); },
                } ) : null
            );

            // ------------------------------------------
            // Panel 2: Type-Specific Settings (conditional)
            // ------------------------------------------
            var typeSpecificPanel = null;

            if ( hasTypeSpecificSettings( type ) ) {
                var typeSpecificControls = [];

                // Lookback days — shown for bestsellers, cross-sell
                if ( vis.lookback_days ) {
                    typeSpecificControls.push(
                        el( RangeControl, {
                            key: 'lookback_days',
                            label: __( 'Lookback Days', 'nudgio' ),
                            help: __( 'Number of days to analyze for recommendations.', 'nudgio' ),
                            value: attributes.lookback_days,
                            onChange: function ( val ) { setAttributes( { lookback_days: val } ); },
                            min: 1,
                            max: 365,
                        } )
                    );
                }

                // Method — shown for bestsellers only
                if ( vis.method ) {
                    typeSpecificControls.push(
                        el( SelectControl, {
                            key: 'method',
                            label: __( 'Ranking Method', 'nudgio' ),
                            value: attributes.method,
                            options: [
                                { label: 'Volume (units sold)',       value: 'volume' },
                                { label: 'Value (revenue)',           value: 'value' },
                                { label: 'Balanced (volume + value)', value: 'balanced' },
                            ],
                            onChange: function ( val ) { setAttributes( { method: val } ); },
                        } )
                    );
                }

                // Min price increase percent — shown for upsell only
                if ( vis.min_price_increase_percent ) {
                    typeSpecificControls.push(
                        el( RangeControl, {
                            key: 'min_price_increase_percent',
                            label: __( 'Min Price Increase %', 'nudgio' ),
                            help: __( 'Only show products at least this % more expensive.', 'nudgio' ),
                            value: attributes.min_price_increase_percent,
                            onChange: function ( val ) { setAttributes( { min_price_increase_percent: val } ); },
                            min: 1,
                            max: 100,
                        } )
                    );
                }

                typeSpecificPanel = el( PanelBody, {
                    title: __( 'Type-Specific Settings', 'nudgio' ),
                    initialOpen: false,
                }, typeSpecificControls );
            }

            // ------------------------------------------
            // Panel 3: Widget Container (Group 1)
            // ------------------------------------------
            var containerPanel = el( PanelBody, { title: __( 'Widget Container', 'nudgio' ), initialOpen: false },
                el( RangeControl, {
                    label: __( 'Padding (px)', 'nudgio' ),
                    help: __( 'Widget container padding in pixels.', 'nudgio' ),
                    value: attributes.widget_padding,
                    onChange: function ( val ) { setAttributes( { widget_padding: val } ); },
                    min: 0,
                    max: 48,
                    step: 2,
                } )
            );

            // ------------------------------------------
            // Panel 4: Widget Title (Group 2)
            // ------------------------------------------
            var titlePanel = el( PanelBody, { title: __( 'Widget Title', 'nudgio' ), initialOpen: false },
                el( TextControl, {
                    label: __( 'Title Text', 'nudgio' ),
                    help: __( 'Leave empty for auto-default based on widget type.', 'nudgio' ),
                    value: attributes.widget_title,
                    onChange: function ( val ) { setAttributes( { widget_title: val } ); },
                } ),
                el( RangeControl, {
                    label: __( 'Title Size (px)', 'nudgio' ),
                    help: __( 'Widget heading font-size in pixels.', 'nudgio' ),
                    value: attributes.title_size,
                    onChange: function ( val ) { setAttributes( { title_size: val } ); },
                    min: 8,
                    max: 48,
                } ),
                el( SelectControl, {
                    label: __( 'Title Alignment', 'nudgio' ),
                    value: attributes.title_alignment,
                    options: [
                        { label: 'Left',   value: 'left' },
                        { label: 'Center', value: 'center' },
                    ],
                    onChange: function ( val ) { setAttributes( { title_alignment: val } ); },
                } )
            );

            // ------------------------------------------
            // Panel 5: Layout (Group 3)
            // ------------------------------------------
            var layoutPanel = el( PanelBody, { title: __( 'Layout', 'nudgio' ), initialOpen: false },
                el( SelectControl, {
                    label: __( 'Layout Style', 'nudgio' ),
                    value: attributes.widget_style,
                    options: [
                        { label: 'Card Grid', value: 'grid' },
                        { label: 'Carousel',  value: 'carousel' },
                    ],
                    onChange: function ( val ) { setAttributes( { widget_style: val } ); },
                } ),
                el( RangeControl, {
                    label: __( 'Columns', 'nudgio' ),
                    help: __( 'Max columns at full width. Responsive: 1→2→N.', 'nudgio' ),
                    value: attributes.widget_columns,
                    onChange: function ( val ) { setAttributes( { widget_columns: val } ); },
                    min: 1,
                    max: 6,
                } ),
                el( RangeControl, {
                    label: __( 'Gap (px)', 'nudgio' ),
                    value: attributes.gap,
                    onChange: function ( val ) { setAttributes( { gap: val } ); },
                    min: 0,
                    max: 48,
                    step: 2,
                } ),
                el( RangeControl, {
                    label: __( 'Card Min Width (px)', 'nudgio' ),
                    help: __( 'Minimum card width. Cards won\'t shrink below this.', 'nudgio' ),
                    value: attributes.card_min_width,
                    onChange: function ( val ) { setAttributes( { card_min_width: val } ); },
                    min: 100,
                    max: 500,
                    step: 10,
                } ),
                el( RangeControl, {
                    label: __( 'Card Max Width (px)', 'nudgio' ),
                    help: __( '0 = no limit. Cards fill available space.', 'nudgio' ),
                    value: attributes.card_max_width,
                    onChange: function ( val ) { setAttributes( { card_max_width: val } ); },
                    min: 0,
                    max: 800,
                    step: 10,
                } )
            );

            // ------------------------------------------
            // Panel 6: Product Card (Group 4)
            // ------------------------------------------
            var cardPanel = el( PanelBody, { title: __( 'Product Card', 'nudgio' ), initialOpen: false },
                el( RangeControl, {
                    label: __( 'Border Radius (px)', 'nudgio' ),
                    help: __( 'Card corner radius in pixels.', 'nudgio' ),
                    value: attributes.card_border_radius,
                    onChange: function ( val ) { setAttributes( { card_border_radius: val } ); },
                    min: 0,
                    max: 50,
                } ),
                el( RangeControl, {
                    label: __( 'Border Width (px)', 'nudgio' ),
                    help: __( 'Card border width in pixels.', 'nudgio' ),
                    value: attributes.card_border_width,
                    onChange: function ( val ) { setAttributes( { card_border_width: val } ); },
                    min: 0,
                    max: 10,
                } ),
                el( SelectControl, {
                    label: __( 'Shadow', 'nudgio' ),
                    value: attributes.card_shadow,
                    options: [
                        { label: 'None',   value: 'none' },
                        { label: 'Small',  value: 'sm' },
                        { label: 'Medium', value: 'md' },
                        { label: 'Large',  value: 'lg' },
                    ],
                    onChange: function ( val ) { setAttributes( { card_shadow: val } ); },
                } ),
                el( RangeControl, {
                    label: __( 'Padding (px)', 'nudgio' ),
                    value: attributes.card_padding,
                    onChange: function ( val ) { setAttributes( { card_padding: val } ); },
                    min: 0,
                    max: 48,
                    step: 2,
                } ),
                el( SelectControl, {
                    label: __( 'Hover Effect', 'nudgio' ),
                    value: attributes.card_hover,
                    options: [
                        { label: 'None',   value: 'none' },
                        { label: 'Lift',   value: 'lift' },
                        { label: 'Shadow', value: 'shadow' },
                        { label: 'Glow',   value: 'glow' },
                    ],
                    onChange: function ( val ) { setAttributes( { card_hover: val } ); },
                } )
            );

            // ------------------------------------------
            // Panel 7: Product Image (Group 5)
            // ------------------------------------------
            var imagePanel = el( PanelBody, { title: __( 'Product Image', 'nudgio' ), initialOpen: false },
                el( RangeControl, {
                    label: __( 'Aspect Ratio Width', 'nudgio' ),
                    help: __( 'e.g. 1 for square, 16 for widescreen.', 'nudgio' ),
                    value: attributes.image_aspect_w,
                    onChange: function ( val ) { setAttributes( { image_aspect_w: val } ); },
                    min: 1,
                    max: 20,
                } ),
                el( RangeControl, {
                    label: __( 'Aspect Ratio Height', 'nudgio' ),
                    help: __( 'e.g. 1 for square, 9 for widescreen.', 'nudgio' ),
                    value: attributes.image_aspect_h,
                    onChange: function ( val ) { setAttributes( { image_aspect_h: val } ); },
                    min: 1,
                    max: 20,
                } ),
                el( SelectControl, {
                    label: __( 'Image Fit', 'nudgio' ),
                    value: attributes.image_fit,
                    options: [
                        { label: 'Cover',   value: 'cover' },
                        { label: 'Contain', value: 'contain' },
                    ],
                    onChange: function ( val ) { setAttributes( { image_fit: val } ); },
                } ),
                el( RangeControl, {
                    label: __( 'Border Radius (px)', 'nudgio' ),
                    help: __( 'Image corner radius in pixels.', 'nudgio' ),
                    value: attributes.image_radius,
                    onChange: function ( val ) { setAttributes( { image_radius: val } ); },
                    min: 0,
                    max: 50,
                } )
            );

            // ------------------------------------------
            // Panel 8: Product Title (Group 6)
            // ------------------------------------------
            var productTitlePanel = el( PanelBody, { title: __( 'Product Title', 'nudgio' ), initialOpen: false },
                el( RangeControl, {
                    label: __( 'Size (px)', 'nudgio' ),
                    help: __( 'Product title font-size in pixels.', 'nudgio' ),
                    value: attributes.product_title_size,
                    onChange: function ( val ) { setAttributes( { product_title_size: val } ); },
                    min: 8,
                    max: 36,
                } ),
                el( RangeControl, {
                    label: __( 'Weight', 'nudgio' ),
                    help: __( 'CSS font-weight (100–900, step 100).', 'nudgio' ),
                    value: attributes.product_title_weight,
                    onChange: function ( val ) { setAttributes( { product_title_weight: val } ); },
                    min: 100,
                    max: 900,
                    step: 100,
                } ),
                el( RangeControl, {
                    label: __( 'Max Lines', 'nudgio' ),
                    value: attributes.product_title_lines,
                    onChange: function ( val ) { setAttributes( { product_title_lines: val } ); },
                    min: 1,
                    max: 3,
                } ),
                el( SelectControl, {
                    label: __( 'Alignment', 'nudgio' ),
                    value: attributes.product_title_alignment,
                    options: [
                        { label: 'Left',   value: 'left' },
                        { label: 'Center', value: 'center' },
                    ],
                    onChange: function ( val ) { setAttributes( { product_title_alignment: val } ); },
                } )
            );

            // ------------------------------------------
            // Panel 9: Price (Group 7)
            // ------------------------------------------
            var pricePanel = el( PanelBody, { title: __( 'Price', 'nudgio' ), initialOpen: false },
                el( ToggleControl, {
                    label: __( 'Show Price', 'nudgio' ),
                    checked: attributes.show_price,
                    onChange: function ( val ) { setAttributes( { show_price: val } ); },
                } ),
                el( RangeControl, {
                    label: __( 'Price Size (px)', 'nudgio' ),
                    help: __( 'Price font-size in pixels.', 'nudgio' ),
                    value: attributes.price_size,
                    onChange: function ( val ) { setAttributes( { price_size: val } ); },
                    min: 8,
                    max: 36,
                } )
            );

            // ------------------------------------------
            // Panel 10: CTA Button (Group 8)
            // ------------------------------------------
            var buttonPanel = el( PanelBody, { title: __( 'CTA Button', 'nudgio' ), initialOpen: false },
                el( TextControl, {
                    label: __( 'Button Text', 'nudgio' ),
                    help: __( 'Call-to-action text (e.g. View, Shop Now, Add to Cart).', 'nudgio' ),
                    value: attributes.button_text,
                    onChange: function ( val ) { setAttributes( { button_text: val } ); },
                } ),
                el( RangeControl, {
                    label: __( 'Border Radius (px)', 'nudgio' ),
                    help: __( 'Button corner radius in pixels.', 'nudgio' ),
                    value: attributes.button_radius,
                    onChange: function ( val ) { setAttributes( { button_radius: val } ); },
                    min: 0,
                    max: 50,
                } ),
                el( RangeControl, {
                    label: __( 'Size (px)', 'nudgio' ),
                    help: __( 'Button font-size in pixels.', 'nudgio' ),
                    value: attributes.button_size,
                    onChange: function ( val ) { setAttributes( { button_size: val } ); },
                    min: 8,
                    max: 24,
                } ),
                el( SelectControl, {
                    label: __( 'Variant', 'nudgio' ),
                    value: attributes.button_variant,
                    options: [
                        { label: 'Solid',   value: 'solid' },
                        { label: 'Outline', value: 'outline' },
                        { label: 'Ghost',   value: 'ghost' },
                    ],
                    onChange: function ( val ) { setAttributes( { button_variant: val } ); },
                } ),
                el( ToggleControl, {
                    label: __( 'Full Width', 'nudgio' ),
                    checked: attributes.button_full_width,
                    onChange: function ( val ) { setAttributes( { button_full_width: val } ); },
                } )
            );

            // ------------------------------------------
            // Color Panels — grouped PanelColorSettings for all hex colors
            // ------------------------------------------
            var colorPanel = el( PanelColorSettings, {
                title: __( 'Colors', 'nudgio' ),
                initialOpen: false,
                colorSettings: [
                    { value: attributes.widget_bg_color,      onChange: function ( val ) { setAttributes( { widget_bg_color: val || '#FFFFFF' } ); },      label: __( 'Widget Background', 'nudgio' ) },
                    { value: attributes.title_color,          onChange: function ( val ) { setAttributes( { title_color: val || '#111827' } ); },          label: __( 'Title', 'nudgio' ) },
                    { value: attributes.card_bg_color,        onChange: function ( val ) { setAttributes( { card_bg_color: val || '#FFFFFF' } ); },        label: __( 'Card Background', 'nudgio' ) },
                    { value: attributes.card_border_color,    onChange: function ( val ) { setAttributes( { card_border_color: val || '#E5E7EB' } ); },    label: __( 'Card Border', 'nudgio' ) },
                    { value: attributes.product_title_color,  onChange: function ( val ) { setAttributes( { product_title_color: val || '#1F2937' } ); },  label: __( 'Product Title', 'nudgio' ) },
                    { value: attributes.price_color,          onChange: function ( val ) { setAttributes( { price_color: val || '#111827' } ); },          label: __( 'Price', 'nudgio' ) },
                    { value: attributes.button_bg_color,      onChange: function ( val ) { setAttributes( { button_bg_color: val || '#3B82F6' } ); },      label: __( 'Button', 'nudgio' ) },
                    { value: attributes.button_text_color,    onChange: function ( val ) { setAttributes( { button_text_color: val || '#FFFFFF' } ); },    label: __( 'Button Text', 'nudgio' ) },
                ],
            } );

            // ------------------------------------------
            // Sidebar — InspectorControls
            // ------------------------------------------
            var sidebar = el( InspectorControls, {},
                widgetSettingsPanel,
                typeSpecificPanel,
                containerPanel,
                titlePanel,
                layoutPanel,
                cardPanel,
                imagePanel,
                productTitlePanel,
                pricePanel,
                buttonPanel,
                colorPanel
            );

            // ------------------------------------------
            // Main Area — Placeholder Preview
            // ------------------------------------------
            var summaryLine = ( typeLabels[ type ] || type )
                + ' \u00B7 ' + attributes.count + ' products'
                + ' \u00B7 ' + ( styleLabels[ attributes.widget_style ] || attributes.widget_style )
                + ' \u00B7 ' + attributes.widget_columns + ' cols';

            var swatches = el( 'div', { style: { display: 'flex', alignItems: 'flex-start', marginTop: '8px' } },
                el( ColorSwatch, { color: attributes.widget_bg_color,  label: 'Widget' } ),
                el( ColorSwatch, { color: attributes.card_bg_color,    label: 'Card' } ),
                el( ColorSwatch, { color: attributes.button_bg_color,  label: 'Button' } ),
                el( 'span', {
                    style: { fontSize: '11px', color: '#757575', marginLeft: '8px', alignSelf: 'center' },
                }, attributes.button_variant + ' \u00B7 ' + attributes.card_shadow + ' shadow' )
            );

            var placeholder = el( Placeholder, {
                icon: 'products',
                label: __( 'Nudgio Technologies', 'nudgio' ),
            },
                el( 'span', { style: { fontSize: '13px', color: '#555' } }, summaryLine ),
                swatches
            );

            // ------------------------------------------
            // Return — Fragment with sidebar + block content
            // ------------------------------------------
            return el( Fragment, {},
                sidebar,
                el( 'div', blockProps, placeholder )
            );
        },

        // save() returns null — server-side rendered via render.php
        save: function () {
            return null;
        },
    } );
} )();
