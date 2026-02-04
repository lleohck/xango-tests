import SwitchChoiceCard from "@/components/ui/switch-choice-card";

export type BiDataParamsFormData = {
  version: "v2" | "v3";
  explainer: boolean;
  is_canary: boolean;
};

type BiDataParamsFormProps = {
  version: "unique" | "batch";
  formData: BiDataParamsFormData;
  setFormData: (
    field: keyof BiDataParamsFormData,
    value: BiDataParamsFormData[keyof BiDataParamsFormData],
  ) => void;
};

export default function BiDataParamsForm({
  version,
  formData,
  setFormData,
}: BiDataParamsFormProps) {
  const unique = (
    <div className="grid gap-4">
      <SwitchChoiceCard
        title="Versão do modelo"
        description="Alterna entre v2 e v3"
        id="version"
        checked={formData.version !== "v2"}
        onCheckedChange={(checked) =>
          setFormData("version", checked ? "v3" : "v2")
        }
      />
      <SwitchChoiceCard
        title="Explainer"
        description="Inclui Explainer na resposta."
        id="explainer"
        checked={formData.explainer}
        onCheckedChange={(checked) => setFormData("explainer", checked)}
      />
      <SwitchChoiceCard
        title="Is Canary"
        description="Utiliza a rota Canary para validações controladas."
        id="is-canary"
        checked={formData.is_canary}
        onCheckedChange={(checked) => setFormData("is_canary", checked)}
      />
    </div>
  );

  const batch = (
    <div className="grid gap-3 w-full">
      <SwitchChoiceCard
        title="Versão do modelo"
        id="version"
        checked={formData.version !== "v2"}
        onCheckedChange={(checked) =>
          setFormData("version", checked ? "v3" : "v2")
        }
      />
      <div className="flex items-center gap-2">
        <SwitchChoiceCard
          title="Explainer"
          id="explainer"
          checked={formData.explainer}
          onCheckedChange={(checked) => setFormData("explainer", checked)}
        />
        <SwitchChoiceCard
          title="Is Canary"
          id="is-canary"
          checked={formData.is_canary}
          onCheckedChange={(checked) => setFormData("is_canary", checked)}
        />
      </div>
    </div>
  );

  if (version === "unique") {
    return unique;
  }

  if (version === "batch") {
    return batch;
  }
}
