import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/react";
import * as globalStorybookConfig from "./preview";

// This will run before the test suite
// It loads the Storybook configuration so that stories are properly decorated
setProjectAnnotations([a11yAddonAnnotations, globalStorybookConfig]);

beforeAll(async () => {
  // Any global setup can go here
});