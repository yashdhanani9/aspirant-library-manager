import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleClearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
            caches.keys().then((names) => {
                names.forEach((name) => {
                    caches.delete(name);
                });
            });
        }
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                        </div>
                        <h1 className="text-2xl font-black text-gray-800 mb-2">Something went wrong</h1>
                        <p className="text-gray-500 mb-6 text-sm">
                            The application encountered an unexpected error. This is often caused by outdated browser data.
                        </p>

                        <div className="bg-gray-100 p-3 rounded-lg text-left text-xs font-mono text-gray-600 mb-6 overflow-auto max-h-32">
                            {this.state.error?.toString()}
                        </div>

                        <button
                            onClick={this.handleClearCache}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-red-200"
                        >
                            Clear Cache & Reload
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-3 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-wider"
                        >
                            Try Reloading Only
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
