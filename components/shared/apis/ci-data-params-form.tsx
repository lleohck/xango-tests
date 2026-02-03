"use client";

import SwitchChoiceCard from "@/components/ui/switch-choice-card";

export type CiDataParamsFormData = {
  bifrost: boolean;
  is_canary: boolean;
};

export default function CiDataParamsForm({
  formData,
  setFormData,
}: {
  formData: CiDataParamsFormData;
  setFormData: <K extends keyof CiDataParamsFormData>(field: K, value: CiDataParamsFormData[K]) => void;
}) {
  return (
    <div className="grid gap-4">
      <SwitchChoiceCard
        title="Bifrost"
        description="Envia appCal=bifrost (GET via query param)."
        id="bifrost"
        checked={formData.bifrost}
        onCheckedChange={(checked) => setFormData("bifrost", checked)}
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