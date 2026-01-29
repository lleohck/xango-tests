import 'server-only';

export type Environment = 'DEV' | 'UAT' | 'PRD';

type Credentials = {
  url: string;
  username: string;
  password: string;
};

export type IamTokenResponse = {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  raw?: unknown; // útil para debug em logs do servidor
};

const REQUIRED = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return v;
};

const getCredentials = (env: Environment): Credentials => {
  const E = env.toUpperCase() as Environment;
  return {
    url: REQUIRED(`AUTH_IAM_${E}_URL`),
    username: REQUIRED(`AUTH_IAM_${E}_USER`),
    password: REQUIRED(`AUTH_IAM_${E}_PASS`),
  };
};

const tokenCache = new Map<
  Environment,
  { token: IamTokenResponse; expiresAt: number }
>();

export async function fetchIamToken(
  env: Environment,
  opts?: { forceRefresh?: boolean }
): Promise<IamTokenResponse> {
  const force = !!opts?.forceRefresh;
  const now = Date.now();

  if (!force) {
    const cached = tokenCache.get(env);
    if (cached && cached.expiresAt - 30_000 > now) {
      return cached.token;
    }
  }

  const { url, username, password } = getCredentials(env);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha na autenticação IAM (${res.status}): ${text}`);
  }

  const data = (await res.json()) as any;
  const accessToken = data?.access_token ?? data?.accessToken;
  if (!accessToken) {
    throw new Error('Resposta da IAM sem access_token');
  }

  const token: IamTokenResponse = {
    accessToken,
    tokenType: data?.token_type ?? data?.tokenType,
    expiresIn: Number(data?.expires_in ?? data?.expiresIn ?? 300),
    raw: data,
  };

  const expiresAt = now + (token.expiresIn ?? 300) * 1000;
  tokenCache.set(env, { token, expiresAt });

  return token;
}