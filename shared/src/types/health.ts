export interface HealthResponse {
  status: 'ok';
  database: string;
}

export interface SimpleHealthResponse {
  status: 'ok';
}

export interface HealthErrorResponse {
  status: 'error';
  database: string;
  error: string;
}

export interface ApiError {
  error: string;
}
