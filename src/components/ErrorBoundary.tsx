import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackActionLabel?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Handled gracefully by UI fallback
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#2E1E12]/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] p-6 text-center text-[#3A2618] shadow-2xl space-y-4">
            <div className="font-display text-lg font-bold">
              {this.props.fallbackTitle ?? 'Görünüm Yenileniyor'}
            </div>
            <p className="text-xs text-[#6B5038] leading-relaxed">
              Beklenmeyen bir arayüz geçişi oluştu. Aşağıdaki düğmeyle güvenle devam edebilirsiniz.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] text-[#FAF2E2] text-xs font-semibold transition-colors cursor-pointer"
            >
              {this.props.fallbackActionLabel ?? 'Devam Et'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
