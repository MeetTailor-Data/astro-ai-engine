import React from 'react';
import { AlertOctagon, RotateCcw, Wrench } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Avionics ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#050811] p-6 text-slate-100">
          <div className="w-full max-w-xl rounded-xl border border-rose-500/50 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 border-b border-rose-500/30 pb-4">
              <AlertOctagon className="h-8 w-8 text-rose-500" />
              <div>
                <div className="text-[10px] font-extrabold tracking-widest text-rose-400">
                  AVIONICS FLIGHT COMPUTER RECOVERY DIRECTIVE
                </div>
                <h1 className="font-display text-lg font-bold text-white">
                  Telemetry Visualization Excursion Intercepted
                </h1>
              </div>
            </div>

            <div className="mt-4 rounded border border-rose-950/70 bg-black/60 p-3 font-mono text-xs text-rose-300">
              <div className="font-semibold text-rose-200">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown runtime exception'}
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300">
              The mission telemetry processor intercepted an unexpected state. The application kernel has been stabilized to prevent screen blackout.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-display text-xs font-bold text-white transition-colors hover:bg-emerald-500 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                RESTORE MISSION CONTROL
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
