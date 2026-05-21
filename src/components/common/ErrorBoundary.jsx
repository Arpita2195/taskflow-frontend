import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-bg text-primary p-6 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
          <p className="text-secondary mb-8 max-w-md">The application encountered an unexpected error. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent text-white rounded-xl font-bold hover:bg-accent/80 transition-all"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
