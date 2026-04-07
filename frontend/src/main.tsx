  import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
  import { createRoot } from 'react-dom/client';
  import App from './App.tsx';
  import './index.css';

  class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    constructor(props: { children: ReactNode }) {
      super(props);
      this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
      // also log to console for developer
      // eslint-disable-next-line no-console
      console.error('Uncaught error:', error, info);
    }

    render() {
      if (this.state.error) {
        return (
          
          <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ color: '#b91c1c' }}>Something went wrong</h1>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', color: '#f8fafc', padding: 12, borderRadius: 8 }}>
              {String(this.state.error && this.state.error.message)}
              {this.state.error && this.state.error.stack ? '\n\n' + this.state.error.stack : ''}
            </pre>
          </div>
        );
      }

      return this.props.children as any;
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
