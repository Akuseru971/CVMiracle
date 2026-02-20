import type { LayoutMetadata } from "@/lib/layout-detector";
import type { TemplateVariant } from "@/lib/layout-mapper";

export type StyleConfig = {
  fontFamily: string;
  baseFontSize: number;
  lineHeight: number;
  sectionGap: number;
  blockGap: number;
  pagePaddingMm: number;
  headerNameSize: number;
  sectionTitleSize: number;
  primaryColor: string;
  accentColor: string;
  sidebarRatio: number;
};

export function resolveStyleConfig(metadata: LayoutMetadata, variant: TemplateVariant): StyleConfig {
  const compact = metadata.spacingProfile === "compact";
  const airy = metadata.spacingProfile === "airy";

  const baseFontSize = compact ? 10.5 : airy ? 11 : 10.8;
  const lineHeight = compact ? 1.22 : airy ? 1.33 : 1.28;

  return {
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif',
    baseFontSize,
    lineHeight,
    sectionGap: compact ? 7 : airy ? 10 : 8,
    blockGap: compact ? 5 : airy ? 8 : 6,
    pagePaddingMm: compact ? 8 : 9,
    headerNameSize: variant === "template_minimal_compact" ? 22 : 24,
    sectionTitleSize: variant === "template_minimal_compact" ? 12 : 13,
    primaryColor: metadata.primaryColor,
    accentColor: metadata.accentColor,
    sidebarRatio: metadata.columnCount === 2 ? metadata.sidebarWidthRatio || 0.31 : 0,
  };
}
