"use client";

import { useEffect, useRef } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SwitchChoiceCard from "@/components/ui/switch-choice-card";
import {
  BatchCustomizationEntry,
  BatchCustomizationPatch,
  listToText,
  textToList,
} from "@/lib/batch-customization-storage";

type BatchCustomizationEnvironmentFormProps = {
  idSuffix: string;
  value: BatchCustomizationEntry;
  onSave: (value: BatchCustomizationPatch) => void;
};

const SAVE_DELAY_MS = 500;

export default function BatchCustomizationEnvironmentForm({
  idSuffix,
  value,
  onSave,
}: BatchCustomizationEnvironmentFormProps) {
  const documentsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleDocumentsSave = (text: string) => {
    if (documentsTimerRef.current) clearTimeout(documentsTimerRef.current);

    documentsTimerRef.current = setTimeout(() => {
      onSave({ documents: textToList(text) });
    }, SAVE_DELAY_MS);
  };

  const scheduleModelsSave = (text: string) => {
    if (modelsTimerRef.current) clearTimeout(modelsTimerRef.current);

    modelsTimerRef.current = setTimeout(() => {
      onSave({ models: textToList(text) });
    }, SAVE_DELAY_MS);
  };

  const flushDocumentsSave = (text: string) => {
    if (documentsTimerRef.current) clearTimeout(documentsTimerRef.current);
    onSave({ documents: textToList(text) });
  };

  const flushModelsSave = (text: string) => {
    if (modelsTimerRef.current) clearTimeout(modelsTimerRef.current);
    onSave({ models: textToList(text) });
  };

  useEffect(() => {
    return () => {
      if (documentsTimerRef.current) clearTimeout(documentsTimerRef.current);
      if (modelsTimerRef.current) clearTimeout(modelsTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`documents-${idSuffix}`}>
            Lista de documentos, separados por vírgula
          </Label>
          <Input
            id={`documents-${idSuffix}`}
            defaultValue={listToText(value.documents)}
            onChange={(event) => scheduleDocumentsSave(event.target.value)}
            onBlur={(event) => flushDocumentsSave(event.target.value)}
            placeholder="00000000000, 11111111111, 22222222222"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`models-${idSuffix}`}>
            Lista de modelos, separados por vírgula
          </Label>
          <Input
            id={`models-${idSuffix}`}
            defaultValue={listToText(value.models)}
            onChange={(event) => scheduleModelsSave(event.target.value)}
            onBlur={(event) => flushModelsSave(event.target.value)}
            placeholder="modelo-1, modelo-2, modelo-3"
          />
        </div>
      </div>

      <SwitchChoiceCard
        id={`enable-customization-${idSuffix}`}
        title="Habilitar personalização"
        description="Se desativado, o sistema usa a configuração padrão."
        checked={value.enabled}
        onCheckedChange={(enabled) => onSave({ enabled })}
      />
    </div>
  );
}
