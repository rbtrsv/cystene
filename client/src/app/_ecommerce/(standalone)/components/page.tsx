'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnections } from '@/modules/ecommerce/hooks/use-ecommerce-connections';
import { useComponents, type WidgetType } from '@/modules/ecommerce/hooks/use-components';
import { getProducts, type DataProduct } from '@/modules/ecommerce/service/data.service';
import { getWidgetAPIKeys } from '@/modules/ecommerce/service/widget-api-keys.service';
import { createOrUpdateSettings } from '@/modules/ecommerce/service/recommendation-settings.service';
import { type WidgetAPIKeyDetail } from '@/modules/ecommerce/schemas/widget-api-keys.schemas';
import { API_BASE_URL } from '@/modules/accounts/utils/api.endpoints';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Loader2, LayoutGrid, Copy, CheckCircle, AlertCircle, Code, Save } from 'lucide-react';
import { getPlatformLabel } from '@/modules/ecommerce/utils/format-utils';

export default function ComponentsPage() {
  const { connections, activeConnectionId, setActiveConnection } = useConnections();
  const { html, isLoading, error, status, fetchWidget, generateEmbedCode } = useComponents();

  // Widget config state — algorithm / data params
  const [widgetType, setWidgetType] = useState<WidgetType>('bestsellers');
  const [productId, setProductId] = useState('');
  const [top, setTop] = useState(4);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [method, setMethod] = useState<'volume' | 'value' | 'balanced'>('volume');
  const [minPriceIncrease, setMinPriceIncrease] = useState(10);
  const [copied, setCopied] = useState(false);

  // Widget config state — visual fields (35 settings in 8 groups)
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

  // Product dropdown state (for cross-sell, upsell, similar widget types)
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsFetched, setProductsFetched] = useState(false);

  // API keys state (for embed code generation)
  const [apiKeys, setApiKeys] = useState<WidgetAPIKeyDetail[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  // Save as Brand Defaults state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const needsProductId = widgetType !== 'bestsellers';
  const needsLookback = widgetType === 'bestsellers' || widgetType === 'cross-sell';
  const needsMethod = widgetType === 'bestsellers';
  const needsMinPriceIncrease = widgetType === 'upsell';

  // Fetch API keys when connection changes
  useEffect(() => {
    if (!activeConnectionId) {
      setApiKeys([]);
      return;
    }

    const fetchApiKeys = async () => {
      setApiKeysLoading(true);
      const response = await getWidgetAPIKeys(activeConnectionId);
      if (response.success && response.data) {
        setApiKeys(response.data);
      } else {
        setApiKeys([]);
      }
      setApiKeysLoading(false);
    };

    fetchApiKeys();
  }, [activeConnectionId]);

  // Fetch products when a non-bestseller widget type is selected and connection is active
  useEffect(() => {
    if (!needsProductId || !activeConnectionId || productsFetched) return;

    const fetchProductList = async () => {
      setProductsLoading(true);
      const response = await getProducts(activeConnectionId);
      setProducts(response.products);
      setProductsFetched(true);
      setProductsLoading(false);
    };

    fetchProductList();
  }, [needsProductId, activeConnectionId, productsFetched]);

  // Reset fetched state when connection changes (need to re-fetch for new connection)
  useEffect(() => {
    setProductsFetched(false);
    setProducts([]);
    setProductId('');
  }, [activeConnectionId]);

  const handleGenerate = async () => {
    if (!activeConnectionId) return;
    if (needsProductId && !productId) return;

    await fetchWidget(widgetType, {
      // Algorithm / data params
      connection_id: activeConnectionId,
      product_id: needsProductId ? productId : undefined,
      top,
      lookback_days: needsLookback ? lookbackDays : undefined,
      method: needsMethod ? method : undefined,
      min_price_increase: needsMinPriceIncrease ? minPriceIncrease : undefined,
      device: 'desktop',
      // Group 1: Widget Container
      widget_bg_color: widgetBgColor,
      widget_padding: widgetPadding,
      // Group 2: Widget Title
      widget_title: widgetTitle,
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
  };

  // Save current visual config as brand defaults in RecommendationSettings
  const handleSaveBrandDefaults = async () => {
    if (!activeConnectionId) return;

    setIsSaving(true);
    setSaveMessage(null);

    const result = await createOrUpdateSettings(activeConnectionId, {
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

    if (result.success) {
      setSaveMessage('Brand defaults saved');
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage(result.error || 'Failed to save');
    }

    setIsSaving(false);
  };

  // Generate embed code using first active API key
  const getEmbedSnippet = useCallback((): string | null => {
    if (!apiKeys.length) return null;

    // Use the first active API key
    const firstKey = apiKeys[0];
    return generateEmbedCode(firstKey.id, API_BASE_URL, widgetType, {
      // Algorithm / data
      top,
      lookbackDays: needsLookback ? lookbackDays : undefined,
      method: needsMethod ? method : undefined,
      minPriceIncrease: needsMinPriceIncrease ? minPriceIncrease : undefined,
      // Group 1: Widget Container
      widgetBgColor,
      widgetPadding,
      // Group 2: Widget Title
      widgetTitle: widgetTitle || undefined,
      titleColor,
      titleSize,
      titleAlignment,
      // Group 3: Layout
      widgetStyle,
      widgetColumns,
      gap,
      cardMinWidth,
      cardMaxWidth,
      // Group 4: Product Card
      cardBgColor,
      cardBorderRadius,
      cardBorderWidth,
      cardBorderColor,
      cardShadow,
      cardPadding,
      cardHover,
      // Group 5: Product Image
      imageAspectW,
      imageAspectH,
      imageFit,
      imageRadius,
      // Group 6: Product Title in Card
      productTitleColor,
      productTitleSize,
      productTitleWeight,
      productTitleLines,
      productTitleAlignment,
      // Group 7: Price
      showPrice,
      priceColor,
      priceSize,
      // Group 8: CTA Button
      buttonText,
      buttonBgColor,
      buttonTextColor,
      buttonRadius,
      buttonSize,
      buttonVariant,
      buttonFullWidth,
    });
  }, [apiKeys, widgetType, top, lookbackDays, method, minPriceIncrease, widgetBgColor, widgetPadding, widgetTitle, titleColor, titleSize, titleAlignment, widgetStyle, widgetColumns, gap, cardMinWidth, cardMaxWidth, cardBgColor, cardBorderRadius, cardBorderWidth, cardBorderColor, cardShadow, cardPadding, cardHover, imageAspectW, imageAspectH, imageFit, imageRadius, productTitleColor, productTitleSize, productTitleWeight, productTitleLines, productTitleAlignment, showPrice, priceColor, priceSize, buttonText, buttonBgColor, buttonTextColor, buttonRadius, buttonSize, buttonVariant, buttonFullWidth, needsLookback, needsMethod, needsMinPriceIncrease, generateEmbedCode]);

  const handleCopy = useCallback(() => {
    const code = getEmbedSnippet();
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getEmbedSnippet]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Components</h1>
        <p className="text-muted-foreground">
          Generate and preview embeddable recommendation widgets
        </p>
      </div>

      {/* Connection Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
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

      {/* Widget Configuration */}
      {activeConnectionId && (
        <>
          {/* Algorithm / Data Params */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Configuration</CardTitle>
              <CardDescription>Select widget type, product, and algorithm parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Widget Type */}
                <div className="space-y-2">
                  <Label>Widget Type</Label>
                  <Select value={widgetType} onValueChange={(v) => setWidgetType(v as WidgetType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bestsellers">Bestsellers</SelectItem>
                      <SelectItem value="cross-sell">Cross-Sell</SelectItem>
                      <SelectItem value="upsell">Upsell</SelectItem>
                      <SelectItem value="similar">Similar Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Product — dropdown shown when needed (cross-sell, upsell, similar) */}
                {needsProductId && (
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={productId} onValueChange={(v) => setProductId(v)} disabled={productsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={productsLoading ? 'Loading products...' : 'Select a product'} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.product_id} value={p.product_id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Number of items */}
                <div className="space-y-2">
                  <Label>Items to Show</Label>
                  <Input type="number" min={1} max={20} value={top} onChange={(e) => setTop(parseInt(e.target.value) || 4)} />
                </div>

                {/* Lookback Days — only for bestsellers and cross-sell (order-based algorithms) */}
                {needsLookback && (
                  <div className="space-y-2">
                    <Label>Lookback Days</Label>
                    <Input type="number" min={1} max={3650} value={lookbackDays} onChange={(e) => setLookbackDays(parseInt(e.target.value) || 30)} />
                  </div>
                )}

                {/* Method — only for bestsellers */}
                {needsMethod && (
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={method} onValueChange={(v) => setMethod(v as 'volume' | 'value' | 'balanced')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="value">Value</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Min Price Increase — only for upsell */}
                {needsMinPriceIncrease && (
                  <div className="space-y-2">
                    <Label>Min Price Increase (%)</Label>
                    <Input type="number" min={0} max={500} value={minPriceIncrease} onChange={(e) => setMinPriceIncrease(parseInt(e.target.value) || 10)} />
                  </div>
                )}
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
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={widgetBgColor} onChange={(e) => setWidgetBgColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input value={widgetBgColor} onChange={(e) => setWidgetBgColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Padding (px)</Label>
                  <Input type="number" min={0} max={48} step={2} value={widgetPadding} onChange={(e) => setWidgetPadding(parseInt(e.target.value) || 0)} />
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
                  <Label>Title Text</Label>
                  <Input value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)} placeholder="Leave empty for auto-default" />
                </div>
                <div className="space-y-2">
                  <Label>Title Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Title Size</Label>
                  <Input type="number" min={8} max={48} step={1} value={titleSize} onChange={(e) => setTitleSize(parseInt(e.target.value) || 24)} />
                  <p className="text-xs text-muted-foreground">Font size in pixels (8–48).</p>
                </div>
                <div className="space-y-2">
                  <Label>Title Alignment</Label>
                  <Select value={titleAlignment} onValueChange={setTitleAlignment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>Layout Style</Label>
                  <Select value={widgetStyle} onValueChange={setWidgetStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Card Grid</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Columns (1-6)</Label>
                  <Input type="number" min={1} max={6} value={widgetColumns} onChange={(e) => setWidgetColumns(parseInt(e.target.value) || 4)} />
                  <p className="text-xs text-muted-foreground">Max columns at full width. Responsive: 1→2→N.</p>
                </div>
                <div className="space-y-2">
                  <Label>Gap (px)</Label>
                  <Input type="number" min={0} max={48} step={2} value={gap} onChange={(e) => setGap(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Gap between cards in pixels.</p>
                </div>
                <div className="space-y-2">
                  <Label>Card Min Width (px)</Label>
                  <Input type="number" min={100} max={500} step={10} value={cardMinWidth} onChange={(e) => setCardMinWidth(parseInt(e.target.value) || 200)} />
                  <p className="text-xs text-muted-foreground">Cards won&apos;t shrink below this — overflow scrolls instead.</p>
                </div>
                <div className="space-y-2">
                  <Label>Card Max Width (px)</Label>
                  <Input type="number" min={0} max={800} step={10} value={cardMaxWidth} onChange={(e) => setCardMaxWidth(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">0 = no limit. Cards fill available space.</p>
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
                  <Label>Card Background</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={cardBgColor} onChange={(e) => setCardBgColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input value={cardBgColor} onChange={(e) => setCardBgColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Radius (px)</Label>
                  <Input type="number" min={0} max={50} step={1} value={cardBorderRadius} onChange={(e) => setCardBorderRadius(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Card corner radius in pixels.</p>
                </div>
                <div className="space-y-2">
                  <Label>Border Width (px)</Label>
                  <Input type="number" min={0} max={10} step={1} value={cardBorderWidth} onChange={(e) => setCardBorderWidth(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Card border width in pixels.</p>
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={cardBorderColor} onChange={(e) => setCardBorderColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input value={cardBorderColor} onChange={(e) => setCardBorderColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Shadow</Label>
                  <Select value={cardShadow} onValueChange={setCardShadow}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Padding (px)</Label>
                  <Input type="number" min={0} max={48} step={2} value={cardPadding} onChange={(e) => setCardPadding(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Card content padding in pixels.</p>
                </div>
                <div className="space-y-2">
                  <Label>Hover Effect</Label>
                  <Select value={cardHover} onValueChange={setCardHover}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>Aspect Ratio Width</Label>
                  <Input type="number" min={1} max={20} value={imageAspectW} onChange={(e) => setImageAspectW(parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-muted-foreground">e.g. 1 for square, 16 for widescreen.</p>
                </div>
                <div className="space-y-2">
                  <Label>Aspect Ratio Height</Label>
                  <Input type="number" min={1} max={20} value={imageAspectH} onChange={(e) => setImageAspectH(parseInt(e.target.value) || 1)} />
                  <p className="text-xs text-muted-foreground">e.g. 1 for square, 9 for widescreen.</p>
                </div>
                <div className="space-y-2">
                  <Label>Image Fit</Label>
                  <Select value={imageFit} onValueChange={setImageFit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="contain">Contain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Border Radius (px)</Label>
                  <Input type="number" min={0} max={50} step={1} value={imageRadius} onChange={(e) => setImageRadius(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Image corner radius in pixels.</p>
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
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={productTitleColor} onChange={(e) => setProductTitleColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input value={productTitleColor} onChange={(e) => setProductTitleColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input type="number" min={8} max={36} step={1} value={productTitleSize} onChange={(e) => setProductTitleSize(parseInt(e.target.value) || 14)} />
                  <p className="text-xs text-muted-foreground">Font size in pixels (8–36).</p>
                </div>
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input type="number" min={100} max={900} step={100} value={productTitleWeight} onChange={(e) => setProductTitleWeight(parseInt(e.target.value) || 600)} />
                  <p className="text-xs text-muted-foreground">CSS font-weight (100–900, step 100).</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Lines (1-3)</Label>
                  <Input type="number" min={1} max={3} value={productTitleLines} onChange={(e) => setProductTitleLines(parseInt(e.target.value) || 2)} />
                </div>
                <div className="space-y-2">
                  <Label>Alignment</Label>
                  <Select value={productTitleAlignment} onValueChange={setProductTitleAlignment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">Display product prices</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Price Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={priceColor} onChange={(e) => setPriceColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input value={priceColor} onChange={(e) => setPriceColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Price Size</Label>
                  <Input type="number" min={8} max={36} step={1} value={priceSize} onChange={(e) => setPriceSize(parseInt(e.target.value) || 18)} />
                  <p className="text-xs text-muted-foreground">Font size in pixels (8–36).</p>
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
                  <Label>Button Text</Label>
                  <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="View" />
                </div>
                <div className="space-y-2">
                  <Label>Button Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={buttonBgColor} onChange={(e) => setButtonBgColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input value={buttonBgColor} onChange={(e) => setButtonBgColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} className="w-12 h-9 p-1" />
                    <Input value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Radius (px)</Label>
                  <Input type="number" min={0} max={50} step={1} value={buttonRadius} onChange={(e) => setButtonRadius(parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Button corner radius in pixels.</p>
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input type="number" min={8} max={24} step={1} value={buttonSize} onChange={(e) => setButtonSize(parseInt(e.target.value) || 14)} />
                  <p className="text-xs text-muted-foreground">Font size in pixels (8–24).</p>
                </div>
                <div className="space-y-2">
                  <Label>Variant</Label>
                  <Select value={buttonVariant} onValueChange={setButtonVariant}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <input type="checkbox" checked={buttonFullWidth} onChange={(e) => setButtonFullWidth(e.target.checked)} className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">Stretch button to full card width</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={isLoading || (needsProductId && !productId)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Preview'
              )}
            </Button>

            {/* Save current visual config as brand defaults in DB */}
            <Button variant="outline" onClick={handleSaveBrandDefaults} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Brand Defaults
                </>
              )}
            </Button>

            {saveMessage && (
              <span className="text-sm text-muted-foreground">{saveMessage}</span>
            )}
          </div>
        </>
      )}

      {/* Waiting for Data — shown when ingest connection has no products yet */}
      {status === 'waiting_for_data' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your integration is active but we haven&apos;t received any data yet.
            Push product and order data via the API to generate recommendations.
            Check the <strong>API Keys</strong> tab on your connection page for integration instructions.
          </AlertDescription>
        </Alert>
      )}

      {/* Live Preview */}
      {html && (
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>This is how the widget will look on your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-lg p-4 overflow-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </CardContent>
        </Card>
      )}

      {/* Embed Code — shown when connection is selected (independent of preview) */}
      {activeConnectionId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Embed Code
            </CardTitle>
            <CardDescription>Copy and paste this code into your website to display the widget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKeysLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading API keys...
              </div>
            ) : apiKeys.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Create a Widget API Key first. Go to Settings → Widget API Keys to generate one.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Textarea
                  readOnly
                  value={getEmbedSnippet() || ''}
                  rows={8}
                  className="font-mono text-sm"
                />
                {needsProductId && (
                  <p className="text-sm text-muted-foreground">
                    Add <code className="bg-muted px-1 rounded">data-product-id=&quot;YOUR_PRODUCT_ID&quot;</code> to
                    the div for product-specific recommendations. Each page needs its own product ID.
                  </p>
                )}
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
