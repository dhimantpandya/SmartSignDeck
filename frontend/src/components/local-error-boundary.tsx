import React, { ErrorInfo } from 'react';
import { Button } from './custom/button';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class LocalErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('LocalErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50/50 border border-red-200 rounded-lg text-red-900 m-4">
                    <h2 className="text-xl font-bold mb-2 text-red-700">UserProfileDialog Crashed</h2>
                    <p className="mb-4">This indicates a frontend rendering error. Please send this screenshot to the AI.</p>
                    <div className="bg-white p-4 rounded border border-red-100 overflow-auto max-h-[300px] mb-4 text-xs font-mono">
                        <span className="font-bold text-red-600 block mb-2">{this.state.error?.toString()}</span>
                        <pre>{this.state.errorInfo?.componentStack}</pre>
                    </div>
                    <Button variant="destructive" onClick={() => this.setState({ hasError: false })}>
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
