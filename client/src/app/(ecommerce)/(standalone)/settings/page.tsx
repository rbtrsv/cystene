'use client';

import { useEffect, useState } from 'react';
import { useConnections } from '@/modules/ecommerce/hooks/use-ecommerce-connections';
import { useSettings } from '@/modules/ecommerce/hooks/use-recommendation-settings';
import { type BestsellerMethod } from '@/modules/ecommerce/schemas/recommendation-settings.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, Settings } from 'lucide-react';
import { getPlatformLabel } from '@/modules/ecommerce/utils/format-utils';

export default function SettingsPage() {
  const { connections, activeConnectionId, setActiveConnection } = useConnections();
  const {
    currentSettings,
    isLoading,
    error,
    fetchSettings,
    createOrUpdateSettings,
    resetSettings,
  } = useSettings();

  // Local form state — matches backend RecommendationSettings model fields
  const [bestsellerMethod, setBestsellerMethod] = useState<BestsellerMethod>('volume');
  const [bestsellerLookbackDays, setBestsellerLookbackDays] = useState(30);
  const [crosssellLookbackDays, setCrosssellLookbackDays] = useState(30);
  const [maxRecommendations, setMaxRecommendations] = useState(10);
  const [minPriceIncreasePercent, setMinPriceIncreasePercent] = useState(10);
  const [shopBaseUrl, setShopBaseUrl] = useState('');
  const [productUrlTemplate, setProductUrlTemplate] = useState('');

  // Local form state — brand identity visual fields (35 settings in 8 groups)
  // Group 1: Widget Container
  const [widgetBgColor, setWidgetBgColor] = useState('#FFFFFF');
  const [widgetPadding, setWidgetPadding] = useState(16);
  // Group 2: Widget Title
  const [widgetTitle, setWidgetTitle] = useState('');
  const [titleColor, setTitleColor] = useState('#111827');
  const [titleSize, setTitleSize] = useState(24);
  const [titleAlignment, setTitleAlignment] = useState('left');
  // Group 3: Layout
  const [widgetStyle, setWidgetStyle] = useState('grid');
  const [widgetColumns, setWidgetColumns] = useState(4);
  const [gap, setGap] = useState(16);
  const [cardMinWidth, setCardMinWidth] = useState(200);
  const [cardMaxWidth, setCardMaxWidth] = useState(0);
  // Group 4: Product Card
  const [cardBgColor, setCardBgColor] = useState('#FFFFFF');
  const [cardBorderRadius, setCardBorderRadius] = useState(8);
  const [cardBorderWidth, setCardBorderWidth] = useState(0);
  const [cardBorderColor, setCardBorderColor] = useState('#E5E7EB');
  const [cardShadow, setCardShadow] = useState('md');
  const [cardPadding, setCardPadding] = useState(16);
  const [cardHover, setCardHover] = useState('lift');
  // Group 5: Product Image
  const [imageAspectW, setImageAspectW] = useState(1);
  const [imageAspectH, setImageAspectH] = useState(1);
  const [imageFit, setImageFit] = useState('cover');
  const [imageRadius, setImageRadius] = useState(8);
  // Group 6: Product Title in Card
  const [productTitleColor, setProductTitleColor] = useState('#1F2937');
  const [productTitleSize, setProductTitleSize] = useState(14);
  const [productTitleWeight, setProductTitleWeight] = useState(600);
  const [productTitleLines, setProductTitleLines] = useState(2);
  const [productTitleAlignment, setProductTitleAlignment] = useState('left');
  // Group 7: Price
  const [showPrice, setShowPrice] = useState(true);
  const [priceColor, setPriceColor] = useState('#111827');
  const [priceSize, setPriceSize] = useState(18);
  // Group 8: CTA Button
  const [buttonText, setButtonText] = useState('View');
  const [buttonBgColor, setButtonBgColor] = useState('#3B82F6');
  const [buttonTextColor, setButtonTextColor] = useState('#FFFFFF');
  const [buttonRadius, setButtonRadius] = useState(6);
  const [buttonSize, setButtonSize] = useState(14);
  const [buttonVariant, setButtonVariant] = useState('solid');
  const [buttonFullWidth, setButtonFullWidth] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Populate form when settings are loaded
  useEffect(() => {
    if (currentSettings) {
      // Algorithm fields
      setBestsellerMethod(currentSettings.bestseller_method);
      setBestsellerLookbackDays(currentSettings.bestseller_lookback_days);
      setCrosssellLookbackDays(currentSettings.crosssell_lookback_days);
      setMaxRecommendations(currentSettings.max_recommendations);
      setMinPriceIncreasePercent(currentSettings.min_price_increase_percent);
      setShopBaseUrl(currentSettings.shop_base_url || '');
      setProductUrlTemplate(currentSettings.product_url_template || '');
      // Brand identity visual fields — use DB value if saved, else keep hardcoded default
      // Group 1: Widget Container
      if (currentSettings.widget_bg_color) setWidgetBgColor(currentSettings.widget_bg_color);
      if (currentSettings.widget_padding != null) setWidgetPadding(currentSettings.widget_padding);
      // Group 2: Widget Title
      if (currentSettings.widget_title != null) setWidgetTitle(currentSettings.widget_title);
      if (currentSettings.title_color) setTitleColor(currentSettings.title_color);
      if (currentSettings.title_size != null) setTitleSize(currentSettings.title_size);
      if (currentSettings.title_alignment) setTitleAlignment(currentSettings.title_alignment);
      // Group 3: Layout
      if (currentSettings.widget_style) setWidgetStyle(currentSettings.widget_style);
      if (currentSettings.widget_columns != null) setWidgetColumns(currentSettings.widget_columns);
      if (currentSettings.gap != null) setGap(currentSettings.gap);
      if (currentSettings.card_min_width != null) setCardMinWidth(currentSettings.card_min_width);
      if (currentSettings.card_max_width != null) setCardMaxWidth(currentSettings.card_max_width);
      // Group 4: Product Card
      if (currentSettings.card_bg_color) setCardBgColor(currentSettings.card_bg_color);
      if (currentSettings.card_border_radius != null) setCardBorderRadius(currentSettings.card_border_radius);
      if (currentSettings.card_border_width != null) setCardBorderWidth(currentSettings.card_border_width);
      if (currentSettings.card_border_color) setCardBorderColor(currentSettings.card_border_color);
      if (currentSettings.card_shadow) setCardShadow(currentSettings.card_shadow);
      if (currentSettings.card_padding != null) setCardPadding(currentSettings.card_padding);
      if (currentSettings.card_hover) setCardHover(currentSettings.card_hover);
      // Group 5: Product Image
      if (currentSettings.image_aspect_w != null) setImageAspectW(currentSettings.image_aspect_w);
      if (currentSettings.image_aspect_h != null) setImageAspectH(currentSettings.image_aspect_h);
      if (currentSettings.image_fit) setImageFit(currentSettings.image_fit);
      if (currentSettings.image_radius != null) setImageRadius(currentSettings.image_radius);
      // Group 6: Product Title in Card
      if (currentSettings.product_title_color) setProductTitleColor(currentSettings.product_title_color);
      if (currentSettings.product_title_size != null) setProductTitleSize(currentSettings.product_title_size);
      if (currentSettings.product_title_weight != null) setProductTitleWeight(currentSettings.product_title_weight);
      if (currentSettings.product_title_lines != null) setProductTitleLines(currentSettings.product_title_lines);
      if (currentSettings.product_title_alignment) setProductTitleAlignment(currentSettings.product_title_alignment);
      // Group 7: Price
      if (currentSettings.show_price != null) setShowPrice(currentSettings.show_price);
      if (currentSettings.price_color) setPriceColor(currentSettings.price_color);
      if (currentSettings.price_size != null) setPriceSize(currentSettings.price_size);
      // Group 8: CTA Button
      if (currentSettings.button_text) setButtonText(currentSettings.button_text);
      if (currentSettings.button_bg_color) setButtonBgColor(currentSettings.button_bg_color);
      if (currentSettings.button_text_color) setButtonTextColor(currentSettings.button_text_color);
      if (currentSettings.button_radius != null) setButtonRadius(currentSettings.button_radius);
      if (currentSettings.button_size != null) setButtonSize(currentSettings.button_size);
      if (currentSettings.button_variant) setButtonVariant(currentSettings.button_variant);
      if (currentSettings.button_full_width != null) setButtonFullWidth(currentSettings.button_full_width);
    }
  }, [currentSettings]);

  // Fetch settings when connection changes
  useEffect(() => {
    if (activeConnectionId) {
      fetchSettings(activeConnectionId);
    }
  }, [activeConnectionId, fetchSettings]);

  const handleSave = async () => {
    if (!activeConnectionId) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // connection_id is passed via URL path, not in the body
      const success = await createOrUpdateSettings(activeConnectionId, {
        // Algorithm fields
        bestseller_method: bestsellerMethod,
        bestseller_lookback_days: bestsellerLookbackDays,
        crosssell_lookback_days: crosssellLookbackDays,
        max_recommendations: maxRecommendations,
        min_price_increase_percent: minPriceIncreasePercent,
        shop_base_url: shopBaseUrl || null,
        product_url_template: productUrlTemplate || null,
        // Brand identity visual fields (35 settings in 8 groups)
        // Group 1: Widget Container
        widget_bg_color: widgetBgColor,
        widget_padding: widgetPadding,
        // Group 2: Widget Title
        widget_title: widgetTitle || null,
        title_color: titleColor,
        title_size: titleSize,
        title_alignment: titleAlignment,
        // Group 3: Layout
        widget_style: widgetStyle,
        widget_columns: widgetColumns,
        gap: gap,
        card_min_width: cardMinWidth,
        card_max_width: cardMaxWidth,
        // Group 4: Product Card
        card_bg_color: cardBgColor,
        card_border_radius: cardBorderRadius,
        card_border_width: cardBorderWidth,
        card_border_color: cardBorderColor,
        card_shadow: cardShadow,
        card_padding: cardPadding,
        card_hover: cardHover,
        // Group 5: Product Image
        image_aspect_w: imageAspectW,
        image_aspect_h: imageAspectH,
        image_fit: imageFit,
        image_radius: imageRadius,
        // Group 6: Product Title in Card
        product_title_color: productTitleColor,
        product_title_size: productTitleSize,
        product_title_weight: productTitleWeight,
        product_title_lines: productTitleLines,
        product_title_alignment: productTitleAlignment,
        // Group 7: Price
        show_price: showPrice,
        price_color: priceColor,
        price_size: priceSize,
        // Group 8: CTA Button
        button_text: buttonText,
        button_bg_color: buttonBgColor,
        button_text_color: buttonTextColor,
        button_radius: buttonRadius,
        button_size: buttonSize,
        button_variant: buttonVariant,
        button_full_width: buttonFullWidth,
      });

      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!activeConnectionId) return;

    setIsResetting(true);
    try {
      await resetSettings(activeConnectionId);
      // Re-fetch to update form
      await fetchSettings(activeConnectionId);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure recommendation settings for your connections
        </p>
      </div>

      {/* Connection Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Select Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="text-muted-foreground">No connections available. Create a connection first.</p>
          ) : (
            <Select
              value={activeConnectionId ? String(activeConnectionId) : ''}
              onValueChange={(value) => setActiveConnection(parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={String(conn.id)}>
                    {conn.connection_name} ({getPlatformLabel(conn.platform)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert>
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Settings Form */}
      {activeConnectionId && !isLoading && (
        <>
          {/* Algorithm Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Configuration</CardTitle>
              <CardDescription>Configure recommendation algorithm parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bestseller-method">Bestseller Method</Label>
                  <Select
                    value={bestsellerMethod}
                    onValueChange={(value) => setBestsellerMethod(value as BestsellerMethod)}
                  >
                    <SelectTrigger id="bestseller-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volume">Volume (sales count)</SelectItem>
                      <SelectItem value="value">Value (revenue)</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-recommendations">Max Recommendations (1-100)</Label>
                  <Input
                    id="max-recommendations"
                    type="number"
                    min={1}
                    max={100}
                    value={maxRecommendations}
                    onChange={(e) => setMaxRecommendations(parseInt(e.target.value) || 10)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bestseller-lookback">Bestseller Lookback Days (1-365)</Label>
                  <Input
                    id="bestseller-lookback"
                    type="number"
                    min={1}
                    max={365}
                    value={bestsellerLookbackDays}
                    onChange={(e) => setBestsellerLookbackDays(parseInt(e.target.value) || 30)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crosssell-lookback">Cross-sell Lookback Days (1-365)</Label>
                  <Input
                    id="crosssell-lookback"
                    type="number"
                    min={1}
                    max={365}
                    value={crosssellLookbackDays}
                    onChange={(e) => setCrosssellLookbackDays(parseInt(e.target.value) || 30)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-price-increase">Min Upsell Price Increase (%)</Label>
                  <Input
                    id="min-price-increase"
                    type="number"
                    min={0}
                    max={1000}
                    value={minPriceIncreasePercent}
                    onChange={(e) => setMinPriceIncreasePercent(parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shop URLs */}
          <Card>
            <CardHeader>
              <CardTitle>Shop URLs</CardTitle>
              <CardDescription>Configure product URL generation for HTML components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop-base-url">Shop Base URL</Label>
                <Input
                  id="shop-base-url"
                  value={shopBaseUrl}
                  onChange={(e) => setShopBaseUrl(e.target.value)}
                  placeholder="https://mystore.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-url-template">Product URL Template</Label>
                <Input
                  id="product-url-template"
                  value={productUrlTemplate}
                  onChange={(e) => setProductUrlTemplate(e.target.value)}
                  placeholder="/products/{handle}"
                />
              </div>
            </CardContent>
          </Card>

          {/* Group 1: Widget Container */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Container</CardTitle>
              <CardDescription>Overall widget background and padding</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="widget-bg-color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={widgetBgColor} onChange={(e) => setWidgetBgColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input id="widget-bg-color" value={widgetBgColor} onChange={(e) => setWidgetBgColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widget-padding">Padding (px)</Label>
                  <Input id="widget-padding" type="number" min={0} max={48} step={2} value={widgetPadding} onChange={(e) => setWidgetPadding(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Widget container padding in pixels.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group 2: Widget Title */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Title</CardTitle>
              <CardDescription>Main heading above the product grid</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="widget-title">Title Text</Label>
                  <Input id="widget-title" value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)} placeholder="Leave empty for auto-default" />
                  <p className="text-xs text-muted-foreground">Leave empty for auto-default based on widget type.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title-color">Title Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input id="title-color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title-size">Title Size (px)</Label>
                  <Input id="title-size" type="number" min={8} max={48} step={1} value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title-alignment">Title Alignment</Label>
                  <Select value={titleAlignment} onValueChange={setTitleAlignment}>
                    <SelectTrigger id="title-alignment"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group 3: Layout */}
          <Card>
            <CardHeader>
              <CardTitle>Layout</CardTitle>
              <CardDescription>Grid style, columns, and spacing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="widget-style">Layout Style</Label>
                  <Select value={widgetStyle} onValueChange={setWidgetStyle}>
                    <SelectTrigger id="widget-style"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Card Grid</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widget-columns">Columns (1-6)</Label>
                  <Input id="widget-columns" type="number" min={1} max={6} value={widgetColumns} onChange={(e) => setWidgetColumns(parseInt(e.target.value) || 4)} />
                  <p className="text-xs text-muted-foreground">Max columns at full width. Responsive: 1→2→N.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gap">Gap (px)</Label>
                  <Input id="gap" type="number" min={0} max={48} step={2} value={gap} onChange={(e) => setGap(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Gap between cards in pixels.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-min-width">Card Min Width (px)</Label>
                  <Input id="card-min-width" type="number" min={100} max={500} step={10} value={cardMinWidth} onChange={(e) => setCardMinWidth(parseInt(e.target.value) || 200)} />
                  <p className="text-xs text-muted-foreground">Minimum card width in pixels. Prevents cards from shrinking below usable size.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-max-width">Card Max Width (px)</Label>
                  <Input id="card-max-width" type="number" min={0} max={800} step={10} value={cardMaxWidth} onChange={(e) => setCardMaxWidth(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Maximum card width in pixels. 0 = no limit.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group 4: Product Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Card</CardTitle>
              <CardDescription>Card background, border, shadow, and hover</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="card-bg-color">Card Background</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={cardBgColor} onChange={(e) => setCardBgColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input id="card-bg-color" value={cardBgColor} onChange={(e) => setCardBgColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-border-radius">Border Radius (px)</Label>
                  <Input id="card-border-radius" type="number" min={0} max={50} step={1} value={cardBorderRadius} onChange={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val)) setCardBorderRadius(val); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-border-width">Border Width (px)</Label>
                  <Input id="card-border-width" type="number" min={0} max={10} step={1} value={cardBorderWidth} onChange={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val)) setCardBorderWidth(val); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-border-color">Border Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={cardBorderColor} onChange={(e) => setCardBorderColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input id="card-border-color" value={cardBorderColor} onChange={(e) => setCardBorderColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-shadow">Shadow</Label>
                  <Select value={cardShadow} onValueChange={setCardShadow}>
                    <SelectTrigger id="card-shadow"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-padding">Padding (px)</Label>
                  <Input id="card-padding" type="number" min={0} max={48} step={2} value={cardPadding} onChange={(e) => setCardPadding(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Card content padding in pixels.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-hover">Hover Effect</Label>
                  <Select value={cardHover} onValueChange={setCardHover}>
                    <SelectTrigger id="card-hover"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="lift">Lift</SelectItem>
                      <SelectItem value="shadow">Shadow</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group 5: Product Image */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
              <CardDescription>Image aspect ratio, fit, and radius</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="image-aspect-w">Aspect Ratio Width</Label>
                  <Input id="image-aspect-w" type="number" min={1} max={20} value={imageAspectW} onChange={(e) => setImageAspectW(parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-muted-foreground">e.g. 1 for square, 16 for widescreen.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-aspect-h">Aspect Ratio Height</Label>
                  <Input id="image-aspect-h" type="number" min={1} max={20} value={imageAspectH} onChange={(e) => setImageAspectH(parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-muted-foreground">e.g. 1 for square, 9 for widescreen.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-fit">Image Fit</Label>
                  <Select value={imageFit} onValueChange={setImageFit}>
                    <SelectTrigger id="image-fit"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="contain">Contain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-radius">Border Radius (px)</Label>
                  <Input id="image-radius" type="number" min={0} max={50} step={1} value={imageRadius} onChange={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val)) setImageRadius(val); }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group 6: Product Title in Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Title</CardTitle>
              <CardDescription>Product name text styling in cards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-title-color">Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={productTitleColor} onChange={(e) => setProductTitleColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input id="product-title-color" value={productTitleColor} onChange={(e) => setProductTitleColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-title-size">Size (px)</Label>
                  <Input id="product-title-size" type="number" min={8} max={36} step={1} value={productTitleSize} onChange={(e) => setProductTitleSize(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-title-weight">Weight</Label>
                  <Input id="product-title-weight" type="number" min={100} max={900} step={100} value={productTitleWeight} onChange={(e) => setProductTitleWeight(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-title-lines">Max Lines (1-3)</Label>
                  <Input id="product-title-lines" type="number" min={1} max={3} value={productTitleLines} onChange={(e) => setProductTitleLines(parseInt(e.target.value) || 2)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-title-alignment">Alignment</Label>
                  <Select value={productTitleAlignment} onValueChange={setProductTitleAlignment}>
                    <SelectTrigger id="product-title-alignment"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group 7: Price */}
          <Card>
            <CardHeader>
              <CardTitle>Price</CardTitle>
              <CardDescription>Price visibility, color, and size</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Show Price</Label>
                  <div className="flex items-center gap-2">
                    <input id="show-price" type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    <Label htmlFor="show-price">Display product prices</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-color">Price Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={priceColor} onChange={(e) => setPriceColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input id="price-color" value={priceColor} onChange={(e) => setPriceColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-size">Price Size (px)</Label>
                  <Input id="price-size" type="number" min={8} max={36} step={1} value={priceSize} onChange={(e) => setPriceSize(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group 8: CTA Button */}
          <Card>
            <CardHeader>
              <CardTitle>CTA Button</CardTitle>
              <CardDescription>Call-to-action button appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="button-text">Button Text</Label>
                  <Input id="button-text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="View" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button-bg-color">Button Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={buttonBgColor} onChange={(e) => setButtonBgColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input id="button-bg-color" value={buttonBgColor} onChange={(e) => setButtonBgColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button-text-color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input id="button-text-color" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button-radius">Border Radius (px)</Label>
                  <Input id="button-radius" type="number" min={0} max={50} step={1} value={buttonRadius} onChange={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val)) setButtonRadius(val); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button-size">Size (px)</Label>
                  <Input id="button-size" type="number" min={8} max={24} step={1} value={buttonSize} onChange={(e) => setButtonSize(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button-variant">Variant</Label>
                  <Select value={buttonVariant} onValueChange={setButtonVariant}>
                    <SelectTrigger id="button-variant"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Full Width</Label>
                  <div className="flex items-center gap-2">
                    <input id="button-full-width" type="checkbox" checked={buttonFullWidth} onChange={(e) => setButtonFullWidth(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    <Label htmlFor="button-full-width">Stretch button to full card width</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save / Reset Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isResetting}>
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset to Defaults'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
