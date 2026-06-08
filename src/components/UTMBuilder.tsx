import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Link2 } from "lucide-react";

interface UTMBuilderProps {
  value: string;
  onChange: (urlTags: string) => void;
  campaignName?: string;
  adSetName?: string;
}

interface UTMFields {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

const MACROS = [
  { label: "{{campaign.name}}", desc: "Nome da campanha" },
  { label: "{{adset.name}}", desc: "Nome do ad set" },
  { label: "{{ad.name}}", desc: "Nome do anúncio" },
  { label: "{{ad.id}}", desc: "ID do anúncio" },
  { label: "{{placement}}", desc: "Posicionamento" },
];

function parseUrlTags(raw: string): UTMFields {
  const fields: UTMFields = {
    utm_source: "facebook",
    utm_medium: "paid",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  };
  if (!raw) return fields;
  const params = new URLSearchParams(raw);
  if (params.has("utm_source")) fields.utm_source = params.get("utm_source")!;
  if (params.has("utm_medium")) fields.utm_medium = params.get("utm_medium")!;
  if (params.has("utm_campaign")) fields.utm_campaign = params.get("utm_campaign")!;
  if (params.has("utm_content")) fields.utm_content = params.get("utm_content")!;
  if (params.has("utm_term")) fields.utm_term = params.get("utm_term")!;
  return fields;
}

function buildUrlTags(fields: UTMFields): string {
  const parts: string[] = [];
  if (fields.utm_source) parts.push(`utm_source=${encodeURIComponent(fields.utm_source)}`);
  if (fields.utm_medium) parts.push(`utm_medium=${encodeURIComponent(fields.utm_medium)}`);
  if (fields.utm_campaign) parts.push(`utm_campaign=${encodeURIComponent(fields.utm_campaign)}`);
  if (fields.utm_content) parts.push(`utm_content=${encodeURIComponent(fields.utm_content)}`);
  if (fields.utm_term) parts.push(`utm_term=${encodeURIComponent(fields.utm_term)}`);
  return parts.join("&");
}

export function UTMBuilder({ value, onChange, campaignName, adSetName }: UTMBuilderProps) {
  const [enabled, setEnabled] = useState(!!value);
  const [fields, setFields] = useState<UTMFields>(() => parseUrlTags(value));

  useEffect(() => {
    if (!enabled) {
      onChange("");
      return;
    }
    const tags = buildUrlTags(fields);
    onChange(tags);
  }, [fields, enabled]);

  const updateField = (key: keyof UTMFields, val: string) => {
    setFields((prev) => ({ ...prev, [key]: val }));
  };

  const insertMacro = (key: keyof UTMFields, macro: string) => {
    setFields((prev) => ({ ...prev, [key]: prev[key] ? `${prev[key]}_${macro}` : macro }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Switch checked={enabled} onCheckedChange={setEnabled} />
        <Label className="flex items-center gap-1.5">
          <Link2 className="h-4 w-4" />
          UTM Parameters
        </Label>
      </div>

      {enabled && (
        <div className="space-y-3 pl-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Source</Label>
              <Input
                placeholder="facebook"
                value={fields.utm_source}
                onChange={(e) => updateField("utm_source", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medium</Label>
              <Input
                placeholder="paid"
                value={fields.utm_medium}
                onChange={(e) => updateField("utm_medium", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Campaign</Label>
            <Input
              placeholder={campaignName || "nome-da-campanha"}
              value={fields.utm_campaign}
              onChange={(e) => updateField("utm_campaign", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Content</Label>
              <Input
                placeholder={adSetName || "variacao-a"}
                value={fields.utm_content}
                onChange={(e) => updateField("utm_content", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Term</Label>
              <Input
                placeholder="interesse-alvo"
                value={fields.utm_term}
                onChange={(e) => updateField("utm_term", e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic macros */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Macros dinâmicas (clique para inserir em Campaign):</p>
            <div className="flex flex-wrap gap-1">
              {MACROS.map((m) => (
                <Badge
                  key={m.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs"
                  onClick={() => insertMacro("utm_campaign", m.label)}
                  title={m.desc}
                >
                  {m.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preview */}
          {buildUrlTags(fields) && (
            <div className="rounded border bg-muted/50 p-2">
              <p className="text-xs text-muted-foreground mb-1">Preview:</p>
              <code className="text-xs break-all">{buildUrlTags(fields)}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
