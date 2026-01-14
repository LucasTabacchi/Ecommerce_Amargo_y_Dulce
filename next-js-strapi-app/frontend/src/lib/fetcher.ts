type FetcherOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function fetcher<T>(url: string, options: FetcherOptions = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} - ${res.statusText} - ${text}`);
  }

  return (await res.json()) as T;
}
