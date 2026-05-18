import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the app title', () => {
    render(<App />);
    expect(screen.getByText('Fullstack TypeScript')).toBeInTheDocument();
  });

  it('should render the health check button', () => {
    render(<App />);
    expect(screen.getByText('Check Health')).toBeInTheDocument();
  });

  it('should show loading state when checking health', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', database: 'connected' }),
    } as Response);

    render(<App />);
    const button = screen.getByText('Check Health');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Checking...')).toBeInTheDocument();
    });
  });

  it('should display health status when successful', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', database: 'connected' }),
    } as Response);

    render(<App />);
    const button = screen.getByText('Check Health');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Database:')).toBeInTheDocument();
      expect(screen.getByText('ok')).toBeInTheDocument();
      expect(screen.getByText('connected')).toBeInTheDocument();
    });
  });

  it('should display error on 400 response', async () => {
    vi.mocked(fetch).mockReturnValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    } as unknown as Response);

    render(<App />);
    const button = screen.getByText('Check Health');

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error: HTTP 400')).toBeInTheDocument();
    });
  });

  it('should display error when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    const button = screen.getByText('Check Health');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('should display error when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<App />);
    const button = screen.getByText('Check Health');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Error: HTTP 500')).toBeInTheDocument();
    });
  });

  it('should display network error when fetch rejects with non-Error', async () => {
    vi.mocked(fetch).mockRejectedValue('String error');

    render(<App />);
    const button = screen.getByText('Check Health');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('should retry on network error', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', database: 'connected' }),
      } as Response);

    render(<App />);
    const button = screen.getByText('Check Health');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, { timeout: 10000 });
  });

  it('should have aria-label on health check button', () => {
    render(<App />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Check backend health');
  });
});
