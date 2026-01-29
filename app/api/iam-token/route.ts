import { NextResponse } from "next/server";
import { fetchIamToken, type Environment } from "@/server/auth/iam";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const environment = String(body?.environment ?? "").toUpperCase();
    const forceRefresh = Boolean(body?.forceRefresh);

    const allowed = ["DEV", "UAT", "PRD"] as const;
    if (!allowed.includes(environment as any)) {
      return NextResponse.json(
        { error: 'Parâmetro "environment" inválido. Use DEV | UAT | PRD.' },
        { status: 400 },
      );
    }

    const token = await fetchIamToken(environment as Environment, {
      forceRefresh,
    });

    return NextResponse.json(
      {
        accessToken: token.accessToken,
        tokenType: token.tokenType ?? "Bearer",
        expiresIn: token.expiresIn ?? 300,
      },
      {
        headers: {
          "cache-control": "no-store, max-age=0",
        },
      },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Erro inesperado" },
      { status: 500 },
    );
  }
}
