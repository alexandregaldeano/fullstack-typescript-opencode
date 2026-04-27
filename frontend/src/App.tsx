import { useState, Suspense } from "react";
import { API_BASE_URL } from "./constants";

interface HealthResponse {
  status: string;
  database: string;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status >= 500) {
        return response;
      }
      if (response.status >= 400 && response.status < 500 && i < retries - 1) {
        continue;
      }
      return response;
    } catch {
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw new Error("Network error");
    }
  }
  throw new Error("Max retries exceeded");
}

function HealthCheck() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry(`${API_BASE_URL}/api/health`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Backend Health</h2>
      <button onClick={checkHealth} disabled={loading} aria-label="Check backend health">
        {loading ? "Checking..." : "Check Health"}
      </button>
      {health && (
        <div className="health-result" role="status">
          <p>
            <strong>Status:</strong> {health.status}
          </p>
          <p>
            <strong>Database:</strong> {health.database}
          </p>
        </div>
      )}
      {error && <div className="error" role="alert">Error: {error}</div>}
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <h1>Fullstack TypeScript</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <HealthCheck />
      </Suspense>
    </div>
  );
}

export default App;
