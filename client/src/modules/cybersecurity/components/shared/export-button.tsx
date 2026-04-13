'use client';

/**
 * Export Button Component
 *
 * Reusable dropdown button for exporting data as PDF or CSV.
 * Used on Findings, Assets, and Report detail pages.
 */

import { useState } from 'react';
import { Button } from '@/modules/shadcnui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shadcnui/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { downloadExport } from '../../utils/export.utils';

interface ExportButtonProps {
  /** Full URL to the export endpoint (without format param) */
  exportUrl: string;
  /** Base filename without extension (e.g., "findings") */
  fileName: string;
  /** Disable the button (e.g., when data is loading) */
  disabled?: boolean;
  /** Show only PDF option (e.g., for reports which are not tabular) */
  pdfOnly?: boolean;
}

export function ExportButton({ exportUrl, fileName, disabled, pdfOnly }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      await downloadExport(exportUrl, fileName, format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        {!pdfOnly && (
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
