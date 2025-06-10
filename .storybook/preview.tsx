import type { Preview } from "@storybook/react-vite";
import React from "react";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      // Simple wrapper for now - LiveStore setup can be added later when needed
      return (
        <div data-testid="storybook-wrapper">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
