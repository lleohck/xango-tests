"use server";

import { Agent } from "undici";
import { fetchIamToken } from "@/server/auth/iam";

export type Env = "DEV" | "UAT" | "PRD";
export type Version = "v2" | "v3";

export type ActionState =
  | { ok: true; data: unknown }
  | { ok: false; error: string; details?: unknown };

function getBaseUrl(env: Env) {
  const key = `NEXT_PUBLIC_API_BI_DATA_${env}_URL` as const;
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Variável de ambiente ${key} não encontrada. Defina no .env.local`,
    );
  }

  return value.replace(/\/+$/, "");
}

/**
 * ⚠️ Apenas para DEV/testes.
 * Ignora validação SSL/TLS (cert self-signed, chain inválida, etc).
 * NUNCA use em UAT/PRD.
 */
const insecureDispatcher =
  process.env.NODE_ENV !== "production"
    ? new Agent({ connect: { rejectUnauthorized: false } })
    : undefined;

export async function fetchBiDataAction(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  try {
    const env = formData.get("env") as Env;
    const version = formData.get("version") as Version;
    const model = String(formData.get("model") ?? "").trim();
    const ndoc = String(formData.get("ndoc") ?? "").trim();

    const explainer = formData.get("explainer") === "on";
    const is_canary = formData.get("is_canary") === "on";

    if (!env || !version)
      return { ok: false, error: "Campos env e version são obrigatórios." };
    if (!model) return { ok: false, error: "Campo model é obrigatório." };
    if (!ndoc) return { ok: false, error: "Campo ndoc é obrigatório." };

    const baseUrl = getBaseUrl(env);

    // ✅ FORMATO CORRETO DA URL
    const url = `${baseUrl}/${version}/${encodeURIComponent(model)}`;

    // ✅ IAM retorna objeto com accessToken
    const token = await fetchIamToken(env);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Canary": String(is_canary),
        explainer: String(explainer),
        ndoc,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.accessToken}`,
      },
      cache: "no-store",

      // ✅ Se quiser restringir 100% a DEV mesmo:
      ...(insecureDispatcher ? { dispatcher: insecureDispatcher } : {}),
    });

    const text = await res.text();

    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status} ${res.statusText}`,
        details: data,
      };
    }

    return { ok: true, data };
  } catch (err: any) {
    // Ajuda muito a identificar "fetch failed"
    // (TLS, DNS, timeout, proxy etc.)
    console.error("fetchBiDataAction error:", err);
    console.error("cause:", err?.cause);

    return {
      ok: false,
      error: err?.message ?? "Erro inesperado",
      details: err?.cause,
    };
  }
}
