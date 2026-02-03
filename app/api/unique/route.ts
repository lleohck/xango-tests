import { NextResponse } from "next/server";
import { fetchIamToken, type Environment } from "@/server/auth/iam";
import { fetchBiData } from "@/server/api/bi-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REQUIRED = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
};

const getApiUrl = (apiType: string, environment: Environment) => {
  const env = environment.toUpperCase() as Environment;
  if (apiType === "bi-data") {
    return REQUIRED(`NEXT_PUBLIC_API_BI_DATA_${env}_URL`);
  }
  if (apiType === "ci-data") {
    return REQUIRED(`NEXT_PUBLIC_API_CI_DATA_${env}_URL`);
  }
  throw new Error('Tipo de API inválido. Use "bi-data" | "ci-data".');
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const environment = String(body?.environment ?? "").toUpperCase();
    const apiType = String(body?.apiType ?? "");
    const payload = body?.payload ?? {};

    const allowedEnvs = ["DEV", "UAT", "PRD"] as const;
    if (!allowedEnvs.includes(environment as any)) {
      return NextResponse.json(
        { error: 'Parâmetro "environment" inválido. Use DEV | UAT | PRD.' },
        { status: 400 },
      );
    }

    if (!["bi-data", "ci-data"].includes(apiType)) {
      return NextResponse.json(
        { error: 'Parâmetro "apiType" inválido. Use bi-data | ci-data.' },
        { status: 400 },
      );
    }

    const token = await fetchIamToken(environment as Environment);
    const apiUrl = getApiUrl(apiType, environment as Environment);

    const res = await fetchBiData(
      apiUrl,
      token.accessToken,
      payload?.version,
      payload?.modelo,
      payload?.ndoc,
      payload?.explainer,
      payload?.is_canary,
    );

    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            (data && typeof data === "object" && "error" in data && data.error) ||
            (typeof data === "string" ? data : null) ||
            text ||
            `Falha ao consultar API (${res.status}).`,
        },
        { status: res.status },
      );
    }

    if (data && typeof data === "string") {
      return NextResponse.json({ data });
    }

    return NextResponse.json(data ?? {});
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Erro inesperado" },
      { status: 500 },
    );
  }
}
