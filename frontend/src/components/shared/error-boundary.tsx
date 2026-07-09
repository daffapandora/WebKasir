'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime error captured by TokoPOS boundary:', error, errorInfo);
    
    // Automatically reload on ChunkLoadError
    if (
      error?.name === 'ChunkLoadError' || 
      error?.message?.includes('ChunkLoadError') || 
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch')
    ) {
      const lastReload = sessionStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload) > 5000) {
        sessionStorage.setItem('last_chunk_error_reload', now.toString());
        console.warn('ChunkLoadError caught by boundary, reloading...');
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen w-full flex items-center justify-center p-6"
          style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
        >
          <div 
            className="card max-w-md w-full p-8 text-center border animate-scale-in"
            style={{ 
              background: 'var(--color-bg-surface)', 
              borderColor: 'var(--color-border-light)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
            }}
          >
            {/* Warning Icon with premium background */}
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/20 flex items-center justify-center mx-auto mb-6 border border-amber-200 dark:border-amber-900/30">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan Sistem</h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Aplikasi mengalami kendala teknis tak terduga saat memuat halaman ini.
            </p>

            {/* Error Details Container */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-gray-55 px-4 py-3 rounded-lg overflow-x-auto text-xs font-mono mb-6 max-h-40 border border-gray-100 dark:border-gray-800 text-red-500">
                <strong>Error:</strong> {this.state.error.message}
                <br />
                {this.state.error.stack}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Halaman
              </button>
              <button 
                onClick={this.handleGoHome}
                className="btn btn-outline flex-1 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Kembali ke Beranda
              </button>
            </div>
            
            <p className="text-[10px] mt-6" style={{ color: 'var(--color-text-muted)' }}>
              TokoPOS Dev Squad • ID Sesi: {Math.random().toString(36).substring(2, 9).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
