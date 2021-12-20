import React from "react";
import { Container } from "@/app/Missing.jsx";

function DisplayError({ error }) {
  return (
    <Container>
      <div>
        <div>{error.name}</div>
        <div>{error.message}</div>
      </div>
    </Container>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(/*error, errorInfo*/) {
    // maybe log the error or something later.
  }

  render() {
    const {
      state: { error },
    } = this;

    if (error) {
      return <DisplayError error={error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
