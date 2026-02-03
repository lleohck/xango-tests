"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SwitchChoiceCard from "@/components/ui/switch-choice-card";

export type CiOrchestratorParamsFormData = {
  user: string;
  cgc: string;
  transaction: string;
  is_canary: boolean;
};

export default function CiOrchestratorParamsForm({
  formData,
  setFormData,
}: {
  formData: CiOrchestratorParamsFormData;
  setFormData: <K extends keyof CiOrchestratorParamsFormData>(
    field: K,
    value: CiOrchestratorParamsFormData[K],
  ) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="user">user</Label>
          <Input
            id="user"
            value={formData.user}
            onChange={(e) => setFormData("user", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cgc">cgc</Label>
          <Input
            id="cgc"
            value={formData.cgc}
            onChange={(e) => setFormData("cgc", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transaction">transaction</Label>
          <Input
            id="transaction"
            value={formData.transaction}
            onChange={(e) => setFormData("transaction", e.target.value)}
          />
        </div>
      </div>

      <SwitchChoiceCard
        title="Is Canary"
        description='Se habilitado, NÃO envia "source=batch" no body.'
        id="is-canary"
        checked={formData.is_canary}
        onCheckedChange={(checked) => setFormData("is_canary", checked)}
      />
    </div>
  );
}
