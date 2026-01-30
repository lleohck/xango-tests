import SwitchChoiceCard from "@/components/ui/switch-choice-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type BiDataParamsFormData = {
  version: "v2" | "v3";
  explainer: boolean;
  is_canary: boolean;
};

type BiDataParamsFormProps = {
  formData: BiDataParamsFormData;
  setFormData: (field: keyof BiDataParamsFormData, value: BiDataParamsFormData[keyof BiDataParamsFormData]) => void;
};

export default function BiDataParamsForm({
  formData,
  setFormData,
}: BiDataParamsFormProps) {
  const handleChange = <K extends keyof BiDataParamsFormData>(
    field: K,
    value: BiDataParamsFormData[K],
  ) => {
    setFormData(field, value);
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="version">Versão do modelo</Label>
          <p className="text-sm text-muted-foreground">
            Alterne entre v2 (estável) e v3 (experimental).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              formData.version === "v2"
                ? "text-sm font-medium text-foreground"
                : "text-sm text-muted-foreground"
            }
          >
            v2
          </span>
          <Switch
            id="version"
            checked={formData.version === "v3"}
            onCheckedChange={(checked) =>
              handleChange("version", checked ? "v3" : "v2")
            }
            aria-label="Alternar versão do modelo"
          />
          <span
            className={
              formData.version === "v3"
                ? "text-sm font-medium text-foreground"
                : "text-sm text-muted-foreground"
            }
          >
            v3
          </span>
        </div>
      </div>
      <SwitchChoiceCard
        title="Explainer"
        description="Inclui detalhes explicativos na resposta."
        id="explainer"
        checked={formData.explainer}
        onCheckedChange={(checked) => handleChange("explainer", checked)}
      />
      <SwitchChoiceCard
        title="Is Canary"
        description="Usa a rota canary para validações controladas."
        id="is-canary"
        checked={formData.is_canary}
        onCheckedChange={(checked) => handleChange("is_canary", checked)}
      />
    </div>
  );
}
