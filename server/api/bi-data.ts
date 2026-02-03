export async function fetchBiData(
  apiUrl: string,
  token: string,
  version: string,
  model: string,
  ndoc: string,
  explainer: boolean,
  is_canary: boolean,
) {
  const res = await fetch(`${apiUrl}/${version}/${model}`, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      ndoc: ndoc,
      explainer: explainer ? "true" : "False",
      "X-Canary": is_canary ? "true" : "false",
      authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha na autenticação IAM (${res.status}): ${text}`);
  }
  return (await res.json()) as any;
}
