import { expect, request as playwrightRequest, test } from "@playwright/test";

import {
  createUniqueCredentials,
  registerUser,
  type RegisterResponseBody,
} from "../../src/api/auth";
import { MythosHomePage } from "../../src/ui/pages/mythos-home-page";

const defaultRestApiBaseUrl = "https://api.qasandbox.ru/api/";

test.describe.configure({ mode: "serial" });

test(
  "UI login works with a user created through the REST API helper",
  { tag: "@ui-example" },
  async ({ page }) => {
    const credentials =
      await test.step("Create unique credentials for the UI scenario", async () =>
        createUniqueCredentials());

    const apiRequest = await playwrightRequest.newContext({
      baseURL: process.env.BASE_URL ?? defaultRestApiBaseUrl,
    });

    try {
      const registerResponse =
        await test.step("Register the user through the REST API helper", async () =>
          registerUser(apiRequest, credentials));

      await expect(registerResponse).toBeOK();

      const registerBody =
        (await registerResponse.json()) as RegisterResponseBody;
      expect(registerBody.message.trim().length).toBeGreaterThan(0);
    } finally {
      await apiRequest.dispose();
    }

    const homePage = new MythosHomePage(page);

    await test.step("Open the REST sandbox page", async () => {
      await homePage.goto();
      await homePage.openRestSandbox();
    });

    await test.step("Log in through the UI with the API-created user", async () => {
      await homePage.loginAs(credentials);
      await homePage.expectAuthenticated();
      await homePage.expectRestTokenStored();
    });

    await test.step("Open an authenticated REST action in the UI", async () => {
      await homePage.openCreateEntityModal();
      await expect(homePage.createEntityModal).toBeVisible();
    });
  },
);
