import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a2e1a] via-[#1a4d2e] to-[#0f3d20] text-white p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-emerald-100">Une erreur s'est produite</h1>
            <div className="bg-white/10 p-4 rounded-lg border border-emerald-700/30">
              <p className="text-emerald-200 mb-2">Erreur :</p>
              <pre className="text-sm text-emerald-300 whitespace-pre-wrap overflow-auto">
                {this.state.error && this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <>
                  <p className="text-emerald-200 mt-4 mb-2">Stack trace :</p>
                  <pre className="text-xs text-emerald-300 whitespace-pre-wrap overflow-auto max-h-96">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


