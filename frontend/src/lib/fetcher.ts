type FetcherOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function fetcher<T>(url: string, options: FetcherOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = 10000; // 10s timeout
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
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
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    // Network-level error (e.g., ECONNREFUSED)
    throw new Error(`Network error: ${err?.message ?? String(err)}`);
  } finally {
    clearTimeout(timeout);
  }
}
