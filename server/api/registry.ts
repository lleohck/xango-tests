// @/server/api-tester/registry.ts
import type { ApiType, Environment } from "@/types/shared";

export type BuiltRequest = {
  method: "GET" | "POST";
  url: string; // URL final (com path e/ou query se necessário)
  headers: Record<string, string>;
  body?: unknown;
};

type RequestPayload = {
  modelo?: unknown;
  ndoc?: unknown;
  is_canary?: unknown;
  version?: unknown;
  explainer?: unknown;
  bifrost?: unknown;
  user?: unknown;
  cgc?: unknown;
  transaction?: unknown;
};

const withNoTrailingSlash = (s: string) => s.replace(/\/+$/, "");

/**
 * Mapeia o apiType (UI) para o prefixo das env vars.
 * Ex:
 *  - bi-data           -> NEXT_PUBLIC_API_BI_DATA_{ENV}_URL
 *  - ci-data           -> NEXT_PUBLIC_API_CI_DATA_{ENV}_URL
 *  - bi-orchestrator   -> NEXT_PUBLIC_API_BI_ORCHESTRATOR_{ENV}_URL
 *  - ci-orchestrator   -> NEXT_PUBLIC_API_CI_ORCHESTRATOR_{ENV}_URL
 */
const API_ENV_PREFIX: Record<ApiType, string> = {
  "bi-data": "BI_DATA",
  "ci-data": "CI_DATA",
  "bi-orchestrator": "BI_ORCHESTRATOR",
  "ci-orchestrator": "CI_ORCHESTRATOR",
};

export function getBaseUrl(apiType: ApiType, env: Environment) {
  const prefix = API_ENV_PREFIX[apiType];
  const key = `NEXT_PUBLIC_API_${prefix}_${env}_URL` as const;
  const value = process.env[key];

  if (!value) {
    throw new Error(`Env var ${key} não encontrada no .env.local`);
  }

  return withNoTrailingSlash(value);
}

function canaryHeader(is_canary?: boolean) {
  return is_canary ? { "X-Canary": "true" } : {};
}

/**
 * Builder de request por API.
 *
 * REGRAS:
 * - BI-DATA = GET
 *   URL:  {baseUrl}/{version}/{model}
 *   Headers: X-Canary (se true), explainer, ndoc
 *
 * - CI-DATA = POST 
 *   URL:  {baseUrl}/{model}    (baseUrl termina em /api/score/v1)
 *   Body: { ndoc, appCal: "bifrost"(se bifrost true) }
 *   Headers: X-Canary (se true)
 *
 * - BI-ORCHESTRATOR = POST
 *   URL: {baseUrl} (termina em /score)
 *   Body fixo conforme especificação
 *   Headers: X-Canary (se true)
 *
 * - CI-ORCHESTRATOR = POST
 *   URL: {baseUrl} (scores-internal)
 *   Body: document pad 11, documentType=2, user/cgc/model/transaction
 *         source="batch" somente se NÃO canary
 *   Headers: X-Canary (se true)
 */
export function buildRequest(
  apiType: ApiType,
  baseUrl: string,
  payload: RequestPayload,
): BuiltRequest {
  const modelo = String(payload.modelo ?? "").trim();
  const ndoc = String(payload.ndoc ?? "").trim();
  const is_canary = Boolean(payload.is_canary);

  if (!modelo) throw new Error("modelo obrigatório");
  if (!ndoc) throw new Error("ndoc obrigatório");

  // -------------------------
  // BI-DATA (GET)
  // baseUrl já termina em .../api/score
  // final: {baseUrl}/{version}/{model}
  // -------------------------
  if (apiType === "bi-data") {
    const version = (payload.version as "v2" | "v3") ?? "v2";
    const explainer = Boolean(payload.explainer);

    return {
      method: "GET",
      url: `${baseUrl}/${version}/${encodeURIComponent(modelo)}`,
      headers: {
        "Content-Type": "application/json",
        ...canaryHeader(is_canary),
        explainer: String(explainer),
        ndoc,
      },
    };
  }

  // -------------------------
  // CI-DATA (POST) 
  // baseUrl termina em .../api/score/v1
  // final: {baseUrl}/{model}
  // body: { ndoc, appCal? }
  // -------------------------
  if (apiType === "ci-data") {
    const bifrost = Boolean(payload.bifrost);

    return {
      method: "POST",
      url: `${baseUrl}/${encodeURIComponent(modelo)}`,
      headers: {
        "Content-Type": "application/json",
        ...canaryHeader(is_canary),
      },
      body: {
        ndoc,
        ...(bifrost ? { appCal: "bifrost" } : {}),
      },
    };
  }

  // -------------------------
  // BI-ORCHESTRATOR (POST)
  // -------------------------
  if (apiType === "bi-orchestrator") {
    const explainer = Boolean(payload.explainer);

    return {
      method: "POST",
      url: baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...canaryHeader(is_canary),
      },
      body: {
        ndoc,
        cgc: "62173620",
        explainer,
        transaction: "transaction",
        user: "user-test",
        countryCode: "BRA",
        model: modelo
      },
    };
  }

  // -------------------------
  // CI-ORCHESTRATOR (POST)
  // source="batch" apenas se NÃO canary
  // document = ndoc pad 11
  // -------------------------
  if (apiType === "ci-orchestrator") {
    const user = String(payload.user ?? "user-test");
    const cgc = String(payload.cgc ?? "62173620");
    const transaction = String(payload.transaction ?? "transaction");

    const document = ndoc.padStart(11, "0");

    const body: {
      document: string;
      documentType: string;
      user: string;
      cgc: string;
      model: string;
      transaction: string;
      source?: string;
    } = {
      document,
      documentType: "2",
      user,
      cgc,
      model: modelo,
      transaction,
      ...(is_canary ? {} : { source: "batch" }),
    };

    return {
      method: "POST",
      url: baseUrl,
      headers: {
        "Content-Type": "application/json",
        ...canaryHeader(is_canary),
      },
      body,
    };
  }

  throw new Error(`apiType não suportado: ${apiType}`);
}
