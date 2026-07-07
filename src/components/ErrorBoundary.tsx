import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-2xl w-full shadow-lg">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <svg className="w-8 h-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h1 className="text-xl font-bold text-slate-900">เกิดข้อผิดพลาดในการโหลดระบบ (Render Error)</h1>
            </div>
            
            <p className="text-slate-600 text-sm mb-6">
              ระบบตรวจพบข้อผิดพลาดร้ายแรงขณะแสดงผลหน้าจอ เพื่อช่วยฝ่ายสนับสนุนกรุณาตรวจสอบรายละเอียดทางเทคนิคด้านล่างนี้:
            </p>

            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-5 rounded border border-slate-800 overflow-auto max-h-96 space-y-3 mb-6">
              <div>
                <span className="text-slate-500 font-bold">[ข้อความผิดพลาด]:</span> {this.state.error?.toString()}
              </div>
              {this.state.error?.stack && (
                <div>
                  <span className="text-slate-500 font-bold">[Stack Trace]:</span>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px] text-slate-300">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  try {
                    window.localStorage.clear();
                  } catch (e) {}
                  window.location.reload();
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded transition shrink-0"
              >
                ล้างข้อมูลบราวเซอร์และรีโหลด
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition shrink-0"
              >
                โหลดใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
