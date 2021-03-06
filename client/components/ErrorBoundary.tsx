import React from 'react';

// interface ReactErrorInfo {
//   componentStack: string;
// }

export interface ErrorProps {
  error: Error;
}

interface Props {
  children: React.ReactNode;
  fallback: React.ComponentType<any>;
}

type State = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return {
      error,
    };
  }

  // // TODO: Send client errors to a server logging service
  // componentDidCatch(error: Error, info?: ReactErrorInfo) {
  //   if (FLAG_PRODUCTION) {
  //     console.error(error, info);
  //   }
  // }

  render() {
    const { children, fallback: Component } = this.props;
    const { error } = this.state;

    return error !== null ? <Component error={error} /> : children;
  }
}
