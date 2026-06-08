import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

export interface DynamicCreativeAssets {
  images: string[];
  titles: string[];
  bodies: string[];
  descriptions: string[];
  ctas: string[];
  link_urls: string[];
}

const EMPTY_ASSETS: DynamicCreativeAssets = {
  images: [],
  titles: [],
  bodies: [],
  descriptions: [],
  ctas: [],
  link_urls: [],
};

const CTA_LIST = [
  "LEARN_MORE", "SHOP_NOW", "SIGN_UP", "DOWNLOAD", "CONTACT_US",
  "SUBSCRIBE", "GET_OFFER", "BOOK_TRAVEL", "APPLY_NOW",
];

const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: "Saiba Mais",
  SHOP_NOW: "Comprar",
  SIGN_UP: "Cadastrar",
  DOWNLOAD: "Baixar",
  CONTACT_US: "Contato",
  SUBSCRIBE: "Assinar",
  GET_OFFER: "Ver Oferta",
  BOOK_TRAVEL: "Reservar",
  APPLY_NOW: "Candidatar",
};

interface DynamicCreativeFormProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  assets: DynamicCreativeAssets;
  onAssetsChange: (assets: DynamicCreativeAssets) => void;
}

export function DynamicCreativeForm({ enabled, onEnabledChange, assets, onAssetsChange }: DynamicCreativeFormProps) {
  const updateField = (field: keyof DynamicCreativeAssets, values: string[]) => {
    onAssetsChange({ ...assets, [field]: values });
  };

  const addItem = (field: keyof DynamicCreativeAssets, value: string) => {
    if (!value.trim()) return;
    const current = assets[field];
    if (!current.includes(value.trim())) {
      updateField(field, [...current, value.trim()]);
    }
  };

  const removeItem = (field: keyof DynamicCreativeAssets, index: number) => {
    updateField(field, assets[field].filter((_, i) => i !== index));
  };

  const toggleCta = (cta: string) => {
    const current = assets.ctas;
    if (current.includes(cta)) {
      updateField("ctas", current.filter((c) => c !== cta));
    } else {
      updateField("ctas", [...current, cta]);
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Switch checked={enabled} onCheckedChange={(v) => {
          onEnabledChange(v);
          if (v && !assets.images.length) onAssetsChange(EMPTY_ASSETS);
        }} />
        <div>
          <Label className="font-medium">Dynamic Creative Optimization (DCO)</Label>
          <p className="text-xs text-muted-foreground">O Facebook testa automaticamente combinações de criativos</p>
        </div>
      </div>

      {enabled && (
        <div className="space-y-4 pt-2">
          <MultiInput
            label="Imagens (URL)"
            placeholder="https://..."
            items={assets.images}
            max={10}
            onAdd={(v) => addItem("images", v)}
            onRemove={(i) => removeItem("images", i)}
          />

          <MultiInput
            label="Títulos (Headlines)"
            placeholder="Título do anúncio"
            items={assets.titles}
            max={5}
            onAdd={(v) => addItem("titles", v)}
            onRemove={(i) => removeItem("titles", i)}
          />

          <MultiInput
            label="Textos Principais"
            placeholder="Texto do anúncio"
            items={assets.bodies}
            max={5}
            onAdd={(v) => addItem("bodies", v)}
            onRemove={(i) => removeItem("bodies", i)}
          />

          <MultiInput
            label="Descrições"
            placeholder="Descrição curta"
            items={assets.descriptions}
            max={5}
            onAdd={(v) => addItem("descriptions", v)}
            onRemove={(i) => removeItem("descriptions", i)}
          />

          <MultiInput
            label="Links de Destino"
            placeholder="https://seusite.com"
            items={assets.link_urls}
            max={5}
            onAdd={(v) => addItem("link_urls", v)}
            onRemove={(i) => removeItem("link_urls", i)}
          />

          <div className="space-y-2">
            <Label className="text-sm">Call to Action</Label>
            <div className="flex flex-wrap gap-2">
              {CTA_LIST.map((cta) => (
                <Badge
                  key={cta}
                  variant={assets.ctas.includes(cta) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCta(cta)}
                >
                  {CTA_LABELS[cta] || cta}
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted rounded-md p-3">
            <strong>Combinações possíveis:</strong>{" "}
            {Math.max(1, assets.images.length) *
              Math.max(1, assets.titles.length) *
              Math.max(1, assets.bodies.length) *
              Math.max(1, assets.ctas.length)}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiInput({
  label,
  placeholder,
  items,
  max,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  items: string[];
  max: number;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      onAdd(input.value);
      input.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs text-muted-foreground">{items.length}/{max}</span>
      </div>
      {items.length < max && (
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            id={`dco-input-${label}`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              const input = document.getElementById(`dco-input-${label}`) as HTMLInputElement;
              if (input) { onAdd(input.value); input.value = ""; }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Badge key={i} variant="secondary" className="gap-1 max-w-[250px] truncate">
              <span className="truncate">{item}</span>
              <X className="h-3 w-3 cursor-pointer shrink-0" onClick={() => onRemove(i)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export { EMPTY_ASSETS };
