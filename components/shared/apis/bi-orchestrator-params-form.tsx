"use client";

import SwitchChoiceCard from "@/components/ui/switch-choice-card";

export type BiOrchestratorParamsFormData = {
  explainer: boolean;
  is_canary: boolean;
};

type BiOrchestratorParamsFormProps = {
  version: "unique" | "batch";
  formData: BiOrchestratorParamsFormData;
  setFormData: <K extends keyof BiOrchestratorParamsFormData>(
    field: K,
    value: BiOrchestratorParamsFormData[K],
  ) => void;
};

export default function BiOrchestratorParamsForm({
  version,
  formData,
  setFormData,
}: BiOrchestratorParamsFormProps) {
  return (
    <div className="grid gap-4">
      <SwitchChoiceCard
        title="Explainer"
        description={
          version == "unique"
            ? "Inclui Explainer na resposta."
            : null
        }
        id="explainer"
        checked={formData.explainer}
        onCheckedChange={(checked) => setFormData("explainer", checked)}
      />
      <SwitchChoiceCard
        title="Is Canary"
        description={
          version == "unique"
            ? "Usa a rota Canary para validações controladas."
            : null
        }
        id="is-canary"
        checked={formData.is_canary}
        onCheckedChange={(checked) => setFormData("is_canary", checked)}
      />
    </div>
  );
}
