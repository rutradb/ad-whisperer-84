import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Globe } from "lucide-react";
import type { ResponsiveSearchAd } from "@/lib/google-ads/types";

interface AdPreviewPanelProps {
  headlines?: Array<{ text: string; pinnedField?: string }>;
  descriptions?: Array<{ text: string; pinnedField?: string }>;
  finalUrls?: string[];
  path1?: string;
  path2?: string;
  title?: string;
}

/**
 * RSA Preview Panel — renders a client-side preview of a Responsive Search Ad.
 * Google Ads does not have a server-side ad preview API like Facebook.
 */
export function AdPreviewPanel({
  headlines = [],
  descriptions = [],
  finalUrls = [],
  path1,
  path2,
  title = "Preview do An\u00fancio",
}: AdPreviewPanelProps) {
  const displayUrl = finalUrls[0]
    ? new URL(finalUrls[0]).hostname + (path1 ? `/${path1}` : "") + (path2 ? `/${path2}` : "")
    : "www.exemplo.com.br";

  const headline = headlines.slice(0, 3).map((h) => h.text).join(" | ");
  const description = descriptions.slice(0, 2).map((d) => d.text).join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-white p-4 space-y-1">
          <div className="text-xs text-muted-foreground">An\u00fancio</div>
          <div className="flex items-center gap-1 text-xs text-green-700">
            <Globe className="h-3 w-3" />
            {displayUrl}
          </div>
          <div className="text-blue-700 text-base font-medium leading-snug">
            {headline || "T\u00edtulo 1 | T\u00edtulo 2 | T\u00edtulo 3"}
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            {description || "Descri\u00e7\u00e3o do an\u00fancio aparece aqui."}
          </div>
        </div>

        {headlines.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              T\u00edtulos ({headlines.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {headlines.map((h, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {h.text}
                  {h.pinnedField && <span className="ml-1 text-orange-500">📌</span>}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {descriptions.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Descri\u00e7\u00f5es ({descriptions.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {descriptions.map((d, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {d.text}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
