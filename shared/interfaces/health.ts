export interface HealthResponse {
  status: 'ok';
  database: string;
}

export interface HealthErrorResponse {
  status: 'error';
  database: string;
  error: string;
}

export interface SimpleHealthResponse {
  status: 'ok';
}
