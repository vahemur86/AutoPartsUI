import type { Preview } from "@storybook/react";

// styles
import "../src/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      options: {
        dark: {
          name: "dark",
          value: "#0e0f11",
        },

        light: {
          name: "light",
          value: "#ffffff",
        }
      }
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    }
  },

  initialGlobals: {
    backgrounds: {
      value: "dark"
    }
  }
};

export default preview;