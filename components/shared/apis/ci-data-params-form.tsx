"use client";

import SwitchChoiceCard from "@/components/ui/switch-choice-card";

export type CiDataParamsFormData = {
  bifrost: boolean;
  is_canary: boolean;
};

type props = {
  version: "unique" | "batch";
  formData: CiDataParamsFormData;
  setFormData: <K extends keyof CiDataParamsFormData>(
    field: K,
    value: CiDataParamsFormData[K],
  ) => void;
};

export default function CiDataParamsForm({
  version,
  formData,
  setFormData,
}: props) {
  return (
    <div className="grid gap-3">
      <SwitchChoiceCard
        title="Bifrost"
        description={version == "unique" ? "Habilita appCal=bifrost" : null}
        id="bifrost"
        checked={formData.bifrost}
        onCheckedChange={(checked) => setFormData("bifrost", checked)}
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
