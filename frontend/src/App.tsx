import { useState, Suspense } from "react";
import { useTranslation } from "react-i18next";
import type { HealthResponse } from "@shared/interfaces";
import { API_BASE_URL } from "./constants";

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, t: (key: string, options?: Record<string, unknown>) => string): Promise<Response> {
  for (let retry_index = 0; retry_index < retries; retry_index++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status >= 500) {
        return response;
      }
      if (response.status >= 400 && response.status < 500 && retry_index < retries - 1) {
        continue;
      }
      return response;
    } catch {
      if (retry_index < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retry_index + 1)));
        continue;
      }
      throw new Error(t("health.networkError"));
    }
  }
  throw new Error(t("health.maxRetries"));
}

function HealthCheck() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry(`${API_BASE_URL}/health`, {}, 3, t);
      if (!res.ok) {
        throw new Error(t("health.httpError", { status: res.status }));
      }
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setError(`${t("health.errorPrefix")} ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>{t("health.heading")}</h2>
      <button onClick={checkHealth} disabled={loading} aria-label={t("health.ariaLabel")}>
        {loading ? t("health.checking") : t("health.checkButton")}
      </button>
      {health && (
        <div className="health-result" role="status">
          <p>
            <strong>{t("health.status")}</strong> {health.status}
          </p>
          <p>
            <strong>{t("health.database")}</strong> {health.database}
          </p>
        </div>
      )}
      {error && <div className="error" role="alert">{error}</div>}
    </div>
  );
}

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="language-switcher">
      <label htmlFor="language-select">{t("language.switchLabel")}:</label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        <option value="en">{t("language.en")}</option>
        <option value="fr">{t("language.fr")}</option>
      </select>
    </div>
  );
}

function App() {
  const { t } = useTranslation();

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t("app.title")}</h1>
        <LanguageSwitcher />
      </header>
      <Suspense fallback={<div>{t("health.loading")}</div>}>
        <HealthCheck />
      </Suspense>
    </div>
  );
}

export default App;
