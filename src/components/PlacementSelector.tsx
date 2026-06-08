import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface NetworkSettings {
  searchNetwork: boolean;
  searchPartners: boolean;
  displayNetwork: boolean;
}

export const DEFAULT_NETWORK_SETTINGS: NetworkSettings = {
  searchNetwork: true,
  searchPartners: false,
  displayNetwork: false,
};

interface PlacementSelectorProps {
  settings: NetworkSettings;
  onSettingsChange: (settings: NetworkSettings) => void;
}

export function PlacementSelector({ settings, onSettingsChange }: PlacementSelectorProps) {
  const toggle = (key: keyof NetworkSettings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-4">
      <Label className="font-medium">Redes de Exibicao</Label>
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={settings.searchNetwork}
            onCheckedChange={() => toggle("searchNetwork")}
          />
          <div>
            <Label className="font-medium">Rede de Pesquisa Google</Label>
            <p className="text-xs text-muted-foreground">Seus anuncios aparecem nos resultados de pesquisa do Google</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            checked={settings.searchPartners}
            onCheckedChange={() => toggle("searchPartners")}
          />
          <div>
            <Label className="font-medium">Parceiros de Pesquisa</Label>
            <p className="text-xs text-muted-foreground">Inclui sites parceiros do Google que exibem resultados de pesquisa</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            checked={settings.displayNetwork}
            onCheckedChange={() => toggle("displayNetwork")}
          />
          <div>
            <Label className="font-medium">Rede de Display</Label>
            <p className="text-xs text-muted-foreground">Seus anuncios aparecem em sites, apps e videos parceiros do Google</p>
          </div>
        </div>
      </div>
    </div>
  );
}
