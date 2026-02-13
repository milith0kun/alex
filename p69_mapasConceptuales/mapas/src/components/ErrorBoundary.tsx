import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  handleReset = () => {
    try {
      localStorage.removeItem("concept-map-v3");
      localStorage.removeItem("concept-map-pos-v3");
      localStorage.removeItem("concept-map-col-v3");
      // Also clear old keys
      localStorage.removeItem("concept-map-data-v2");
      localStorage.removeItem("concept-map-positions-v2");
      localStorage.removeItem("concept-map-collapsed");
    } catch { /* */ }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Algo salió mal</h2>
            <p className="text-sm text-gray-500 mb-4">{this.state.error}</p>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              🔄 Restablecer y recargar
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Esto limpiará los datos guardados y reiniciará la aplicación.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
