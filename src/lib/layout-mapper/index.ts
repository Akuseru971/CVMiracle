import type { LayoutMetadata } from "@/lib/layout-detector";

export type TemplateVariant =
  | "template_two_column_left_v2"
  | "template_two_column_right_v2"
  | "template_minimal_compact"
  | "template_executive_balanced"
  | "template_asymmetric_signature";

export function mapLayoutToTemplate(metadata: LayoutMetadata): TemplateVariant {
  if (metadata.layoutType === "two-column-left") return "template_two_column_left_v2";
  if (metadata.layoutType === "two-column-right") return "template_two_column_right_v2";
  if (metadata.layoutType === "multi-block-asymmetric") return "template_asymmetric_signature";
  if (metadata.hierarchyStyle === "minimal") return "template_minimal_compact";
  return "template_executive_balanced";
}
