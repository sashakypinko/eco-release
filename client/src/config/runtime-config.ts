export interface RuntimeConfig {
  nodeEnv: string;
  apiBaseUrl: string;
  [key: string]: string;
}

const defaultConfig: RuntimeConfig = {
  nodeEnv: "development",
  apiBaseUrl: "/api",
};

let cachedConfig: RuntimeConfig | null = null;

export async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
    cachedConfig = await res.json();
    return cachedConfig!;
  } catch (err) {
    console.warn("Failed to load runtime config, using defaults:", err);
    cachedConfig = defaultConfig;
    return cachedConfig;
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!cachedConfig) {
    throw new Error("Runtime config not loaded yet. Call fetchRuntimeConfig() first.");
  }
  return cachedConfig;
}
