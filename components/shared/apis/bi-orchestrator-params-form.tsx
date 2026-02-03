"use client";

import SwitchChoiceCard from "@/components/ui/switch-choice-card";

export type BiOrchestratorParamsFormData = {
  explainer: boolean;
  is_canary: boolean;
};

export default function BiOrchestratorParamsForm({
  formData,
  setFormData,
}: {
  formData: BiOrchestratorParamsFormData;
  setFormData: <K extends keyof BiOrchestratorParamsFormData>(field: K, value: BiOrchestratorParamsFormData[K]) => void;
}) {
  return (
    <div className="grid gap-4">
      <SwitchChoiceCard
        title="Explainer"
        description="Inclui detalhes explicativos no body (POST)."
        id="explainer"
        checked={formData.explainer}
        onCheckedChange={(checked) => setFormData("explainer", checked)}
      />
      <SwitchChoiceCard
        title="Is Canary"
        description="Envia header X-Canary=true (senão não envia)."
        id="is-canary"
        checked={formData.is_canary}
        onCheckedChange={(checked) => setFormData("is_canary", checked)}
      />
    </div>
  );
}