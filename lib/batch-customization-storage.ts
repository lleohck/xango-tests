import type { ApiType, Environment } from "@/types/shared";

export const BATCH_CUSTOMIZATION_STORAGE_KEY = "xango:batch-customization:v1";
const BATCH_CUSTOMIZATION_ENTRY_PREFIX = "xango:batch-customization-entry:v1";
const LEGACY_ENABLED_KEY = "habilitado";
const LEGACY_DOCUMENTS_KEY = "documentos";
const LEGACY_MODELS_KEY = "modelos";
const LEGACY_UPDATED_AT_KEY = "atualizadoEm";

export const BATCH_APIS: ApiType[] = [
  "bi-data",
  "ci-data",
  "bi-orchestrator",
  "ci-orchestrator",
];

export const BATCH_ENVIRONMENTS: Environment[] = ["DEV", "UAT", "PRD"];

export const BATCH_API_LABELS: Record<ApiType, string> = {
  "bi-data": "bi-data",
  "ci-data": "ci-data",
  "bi-orchestrator": "bi-orchestrator",
  "ci-orchestrator": "ci-orchestrator",
};

export const BATCH_ENVIRONMENT_LABELS: Record<Environment, string> = {
  DEV: "DEV",
  UAT: "UAT",
  PRD: "PROD",
};

export type BatchCustomizationEntry = {
  enabled: boolean;
  documents: string[];
  models: string[];
  updatedAt: string | null;
};

export type BatchCustomizationData = Record<
  ApiType,
  Record<Environment, BatchCustomizationEntry>
>;

export type BatchCustomizationPatch = Partial<
  Pick<BatchCustomizationEntry, "enabled" | "documents" | "models">
>;

function getEntryStorageKey(api: ApiType, environment: Environment) {
  return `${BATCH_CUSTOMIZATION_ENTRY_PREFIX}:${api}:${environment}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
}

function createDefaultEntry(): BatchCustomizationEntry {
  return {
    enabled: false,
    documents: [],
    models: [],
    updatedAt: null,
  };
}

function normalizeEntry(
  value: unknown,
  fallback: BatchCustomizationEntry,
): BatchCustomizationEntry {
  if (!isObject(value)) return fallback;

  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : fallback.enabled,
    documents: normalizeList(value.documents),
    models: normalizeList(value.models),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
  };
}

export function createDefaultBatchCustomization(): BatchCustomizationData {
  const data = {} as BatchCustomizationData;

  for (const api of BATCH_APIS) {
    data[api] = {} as Record<Environment, BatchCustomizationEntry>;

    for (const environment of BATCH_ENVIRONMENTS) {
      data[api][environment] = createDefaultEntry();
    }
  }

  return data;
}

function normalizeData(value: unknown): BatchCustomizationData {
  const fallback = createDefaultBatchCustomization();
  if (!isObject(value)) return fallback;

  for (const api of BATCH_APIS) {
    for (const environment of BATCH_ENVIRONMENTS) {
      fallback[api][environment] = normalizeEntry(
        (value[api] as Record<Environment, unknown> | undefined)?.[environment],
        fallback[api][environment],
      );
    }
  }

  return fallback;
}

function normalizeLegacyData(value: unknown): BatchCustomizationData | null {
  if (!isObject(value)) return null;

  const fallback = createDefaultBatchCustomization();
  let hasLegacyData = false;

  for (const api of BATCH_APIS) {
    const apiValue = value[api];
    if (!isObject(apiValue)) continue;

    for (const environment of BATCH_ENVIRONMENTS) {
      const entry = apiValue[environment];
      if (!isObject(entry)) continue;

      const enabled =
        typeof entry[LEGACY_ENABLED_KEY] === "boolean"
          ? (entry[LEGACY_ENABLED_KEY] as boolean)
          : fallback[api][environment].enabled;
      const documents = normalizeList(entry[LEGACY_DOCUMENTS_KEY]);
      const models = normalizeList(entry[LEGACY_MODELS_KEY]);
      const updatedAt =
        typeof entry[LEGACY_UPDATED_AT_KEY] === "string"
          ? (entry[LEGACY_UPDATED_AT_KEY] as string)
          : null;

      fallback[api][environment] = {
        enabled,
        documents,
        models,
        updatedAt,
      };

      hasLegacyData = true;
    }
  }

  return hasLegacyData ? fallback : null;
}

function writeEntryToStorage(
  api: ApiType,
  environment: Environment,
  entry: BatchCustomizationEntry,
): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getEntryStorageKey(api, environment), JSON.stringify(entry));
}

function readEntryFromStorage(
  api: ApiType,
  environment: Environment,
): BatchCustomizationEntry | null {
  if (typeof window === "undefined") return null;

  const content = window.localStorage.getItem(getEntryStorageKey(api, environment));
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as unknown;
    return normalizeEntry(parsed, createDefaultEntry());
  } catch {
    return null;
  }
}

function migrateFromLegacyStorage(): BatchCustomizationData | null {
  if (typeof window === "undefined") return null;

  const content = window.localStorage.getItem(BATCH_CUSTOMIZATION_STORAGE_KEY);
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as unknown;
    const legacyData = normalizeLegacyData(parsed) ?? normalizeData(parsed);
    saveBatchCustomization(legacyData);
    window.localStorage.removeItem(BATCH_CUSTOMIZATION_STORAGE_KEY);
    return legacyData;
  } catch {
    return null;
  }
}

export function readBatchCustomization(): BatchCustomizationData {
  if (typeof window === "undefined") return createDefaultBatchCustomization();

  const migratedData = migrateFromLegacyStorage();
  if (migratedData) return migratedData;

  const data = createDefaultBatchCustomization();

  for (const api of BATCH_APIS) {
    for (const environment of BATCH_ENVIRONMENTS) {
      const stored = readEntryFromStorage(api, environment);
      if (stored) data[api][environment] = stored;
    }
  }

  return data;
}

export function saveBatchCustomization(data: BatchCustomizationData): void {
  if (typeof window === "undefined") return;

  for (const api of BATCH_APIS) {
    for (const environment of BATCH_ENVIRONMENTS) {
      writeEntryToStorage(api, environment, data[api][environment]);
    }
  }
}

export function updateBatchCustomization(
  api: ApiType,
  environment: Environment,
  patch: BatchCustomizationPatch,
): BatchCustomizationData {
  const currentData = readBatchCustomization();
  const currentEntry = currentData[api][environment];

  const nextEntry: BatchCustomizationEntry = {
    ...currentEntry,
    ...patch,
    documents: patch.documents ?? currentEntry.documents,
    models: patch.models ?? currentEntry.models,
    updatedAt: new Date().toISOString(),
  };

  writeEntryToStorage(api, environment, nextEntry);

  return {
    ...currentData,
    [api]: {
      ...currentData[api],
      [environment]: nextEntry,
    },
  };
}

export function textToList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function listToText(list: string[]): string {
  return list.join(", ");
}
