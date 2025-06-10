import "@testing-library/jest-dom";
import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

// Simple test wrapper for basic component testing
interface TestProviderProps {
  children: React.ReactNode;
}

function TestProvider({ children }: TestProviderProps) {
  // Simple wrapper for now - can be enhanced later for LiveStore
  return <div data-testid="test-wrapper">{children}</div>;
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => {
  return render(ui, {
    wrapper: ({ children }) => <TestProvider>{children}</TestProvider>,
    ...options,
  });
};

// Mock createTestStore for tests that expect it
const createTestStore = () => {
  return {
    mutate: () => Promise.resolve(undefined),
    query: () => [],
    subscribe: () => () => {},
  };
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render, createTestStore };
