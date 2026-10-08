import { expect, test, type Page } from "@playwright/test";

const storefront = process.env.E2E_STOREFRONT_URL!;
const admin = process.env.E2E_ADMIN_URL!;
const vendor = process.env.E2E_VENDOR_URL!;
const api = process.env.E2E_API_URL!;
const password = process.env.E2E_PASSWORD!;

async function signIn(page: Page, role: "customer" | "admin" | "vendor") {
  await page.getByLabel("Email").fill(`${role}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const response = page.waitForResponse((item) =>
    item.url().endsWith("/api/auth/login"),
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const login = await response;
  expect(login.status()).toBe(200);
}

async function expectPrivateCookies(page: Page, origin: string) {
  const cookies = await page.context().cookies(origin);
  for (const name of ["ecom.access", "ecom.refresh", "ecom.role"]) {
    expect(cookies.find((cookie) => cookie.name === name)?.httpOnly).toBe(true);
  }
  const visible = await page.evaluate(() => document.cookie);
  expect(visible).not.toContain("ecom.access");
  expect(visible).not.toContain("ecom.refresh");
  expect(visible).not.toContain("ecom.role");
}

test("fresh storefront login stays public and customer stays on storefront", async ({
  page,
  request,
}) => {
  const contract = await request.post(`${storefront}/api/auth/login`, {
    headers: { Origin: storefront },
    data: { email: "customer@example.test", password },
  });
  expect(contract.status()).toBe(200);
  const body = await contract.json();
  expect(body.user.role).toBe("customer");
  expect(body).not.toHaveProperty("accessToken");
  expect(body).not.toHaveProperty("refreshToken");
  await page.goto(`${storefront}/en/login`);
  await expect(page).toHaveURL(`${storefront}/en/login`);
  await signIn(page, "customer");
  await expect(page).toHaveURL(`${storefront}/en`);
  await expectPrivateCookies(page, storefront);
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(`${storefront}/en/login`);
  expect(
    (await page.context().cookies(storefront)).find(
      (cookie) => cookie.name === "ecom.access",
    ),
  ).toBeUndefined();
});

test("direct localized admin visit completes handoff, refreshes, and recovers from terminal 401", async ({
  page,
}) => {
  let callbackUrl: string | undefined;
  page.on("request", (request) => {
    if (request.url().startsWith(`${admin}/auth/callback?`))
      callbackUrl = request.url();
  });
  await page.goto(`${admin}/fr/orders?page=2`);
  await expect(page).toHaveURL(/store\.localhost:3311\/en\/login\?returnTo=/);
  await signIn(page, "admin");
  await expect(page).toHaveURL(`${admin}/fr/orders?page=2`);
  await expectPrivateCookies(page, admin);
  await expectPrivateCookies(page, storefront);
  await page.reload();
  await expect(page).toHaveURL(`${admin}/fr/orders?page=2`);
  expect(
    (await page.request.get(`${admin}/api/backend/admin/orders`)).status(),
  ).toBe(200);

  const storefrontCookies = await page.context().cookies(storefront);
  const adminCookies = await page.context().cookies(admin);
  expect(
    storefrontCookies.find((cookie) => cookie.name === "ecom.access")?.value,
  ).not.toBe(
    adminCookies.find((cookie) => cookie.name === "ecom.access")?.value,
  );

  await page.goto(`${admin}/auth/failed`);
  const before = await (await page.request.get(`${api}/__metrics`)).json();
  await page.context().addCookies([
    {
      name: "ecom.access",
      value: "expired-access",
      domain: "admin.localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
  const userResponse = await page.request.get(`${admin}/api/backend/users/me`);
  expect(userResponse.status()).toBe(200);
  expect((await userResponse.json()).role).toBe("admin");
  const after = await (await page.request.get(`${api}/__metrics`)).json();
  expect(after.refreshCount - before.refreshCount).toBe(1);

  const unauthorized = await page.request.get(
    `${admin}/api/backend/always-unauthorized`,
  );
  expect(unauthorized.status()).toBe(401);
  expect(
    (await page.context().cookies(admin)).find(
      (cookie) => cookie.name === "ecom.access",
    ),
  ).toBeUndefined();
  await page.goto(`${admin}/en`);
  await expect(page).toHaveURL(`${admin}/en`);
  expect(callbackUrl).toBeTruthy();
  await page.goto(callbackUrl!);
  await expect(page).toHaveURL(`${admin}/auth/failed?reason=invalid-state`);
  await page.goto(`${admin}/en`);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(`${storefront}/en/login`);
  expect(
    (await page.context().cookies(admin)).find(
      (cookie) => cookie.name === "ecom.access",
    ),
  ).toBeUndefined();
});

test("storefront-initiated admin and vendor login begins dashboard-local handoff", async ({
  page,
}) => {
  await page.goto(`${storefront}/en/login`);
  await signIn(page, "admin");
  await expect(page).toHaveURL(`${admin}/en`);
  await expectPrivateCookies(page, admin);

  await page.context().clearCookies();
  await page.goto(`${storefront}/en/login`);
  await signIn(page, "vendor");
  await expect(page).toHaveURL(`${vendor}/en`);
  await expectPrivateCookies(page, vendor);
  expect(
    (await page.request.get(`${vendor}/api/backend/vendors/me`)).status(),
  ).toBe(200);
});

test("direct vendor visit uses its own session and logout clears only that host", async ({
  page,
}) => {
  await page.goto(`${vendor}/en`);
  await expect(page).toHaveURL(/store\.localhost:3311\/en\/login\?returnTo=/);
  await signIn(page, "vendor");
  await expect(page).toHaveURL(`${vendor}/en`);
  await expectPrivateCookies(page, vendor);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(`${storefront}/en/login`);
  expect(
    (await page.context().cookies(vendor)).find(
      (cookie) => cookie.name === "ecom.access",
    ),
  ).toBeUndefined();
  expect(
    (await page.context().cookies(storefront)).find(
      (cookie) => cookie.name === "ecom.access",
    ),
  ).toBeDefined();
  await page.goto(`${vendor}/en`);
  await expect(page).toHaveURL(`${vendor}/en`);
});

test("wrong role and expired callback fail without a redirect loop", async ({
  page,
}) => {
  await page.goto(`${storefront}/en/login`);
  await signIn(page, "customer");
  await expect(page).toHaveURL(`${storefront}/en`);
  await page.goto(`${admin}/en`);
  await expect(page).toHaveURL(
    `${storefront}/auth/failed?reason=authorization`,
  );

  await page.context().clearCookies();
  const start = await page.request.get(`${admin}/auth/start?returnTo=%2Fen`, {
    maxRedirects: 0,
  });
  expect(start.status()).toBe(307);
  const state = (await page.context().cookies(`${admin}/auth/callback`)).find(
    (cookie) => cookie.name === "ecom.admin.handoff.state",
  )?.value;
  expect(state).toBeTruthy();
  await page.goto(
    `${admin}/auth/callback?code=${"A".repeat(43)}&state=${state}`,
  );
  await expect(page).toHaveURL(`${admin}/auth/failed?reason=expired-or-used`);
  expect(
    (await page.context().cookies(`${admin}/auth/callback`)).find(
      (cookie) => cookie.name === "ecom.admin.handoff.state",
    ),
  ).toBeUndefined();
});
