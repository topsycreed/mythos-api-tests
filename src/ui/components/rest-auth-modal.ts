import type { Locator, Page } from "@playwright/test";

import type { AuthCredentials } from "../../api/auth";

export class RestAuthModal {
  readonly page: Page;

  readonly usernameInput: Locator;

  readonly passwordInput: Locator;

  readonly loginButton: Locator;

  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator("#auth-user");
    this.passwordInput = page.locator("#auth-pass");
    this.loginButton = page
      .locator("#modal-auth")
      .getByRole("button", { name: "Войти" });
    this.registerButton = page
      .locator("#modal-auth")
      .getByRole("button", { name: "Регистрация" });
  }

  async fillCredentials(credentials: AuthCredentials): Promise<void> {
    await this.usernameInput.fill(credentials.username);
    await this.passwordInput.fill(credentials.password);
  }

  async login(credentials: AuthCredentials): Promise<void> {
    await this.fillCredentials(credentials);
    await this.loginButton.click();
  }
}
