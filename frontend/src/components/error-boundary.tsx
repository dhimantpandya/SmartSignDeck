import { Component, ErrorInfo, ReactNode } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "./custom/button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground p-10 text-center">
                    <IconAlertTriangle size={64} className="mb-6 text-destructive" />
                    <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-muted-foreground opacity-80 max-w-md mb-6">
                        The application encountered an unexpected error.
                        {this.state.error?.message && (
                            <code className="block mt-2 p-2 bg-muted rounded text-xs">
                                {this.state.error.message}
                            </code>
                        )}
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="default"
                    >
                        Reload Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
