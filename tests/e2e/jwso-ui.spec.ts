import { expect, test } from "@playwright/test";

const storefront = process.env.E2E_STOREFRONT_URL!;
const admin = process.env.E2E_ADMIN_URL!;
const vendor = process.env.E2E_VENDOR_URL!;
const password = process.env.E2E_PASSWORD!;

const product = {
  id: "product-1",
  name: "Everyday tote",
  description: "A practical everyday bag.",
  price: 48,
  stockQuantity: 5,
  imageUrls: [],
  category: { id: "accessories", name: "Accessories" },
  vendor: { companyName: "Test Vendor" },
};

test("storefront search, category and product detail work at desktop and mobile widths", async ({
  page,
}, testInfo) => {
  const seenQueries: string[] = [];
  await page.route("**/api/backend/categories", (route) =>
    route.fulfill({ json: [{ id: "accessories", name: "Accessories" }] }),
  );
  await page.route("**/api/backend/products**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/products/product-1"))
      return route.fulfill({ json: product });
    seenQueries.push(url.search);
    return route.fulfill({ json: { data: [product], page: 1, totalPages: 1 } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${storefront}/en`);
  await expect(
    page.getByRole("heading", { name: "Explore products" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Everyday tote/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  await page.screenshot({
    path: testInfo.outputPath("storefront-desktop.png"),
    fullPage: true,
  });

  await page
    .getByRole("searchbox", { name: "Search products" })
    .first()
    .fill("tote");
  await page.getByRole("button", { name: "Search products" }).first().click();
  await expect(page).toHaveURL(/search=tote/);
  await expect(
    page.getByRole("heading", { name: /Results for/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Accessories" }).click();
  await expect(page).toHaveURL(/category=accessories/);
  await expect
    .poll(() =>
      seenQueries.some(
        (query) =>
          query.includes("search=tote") &&
          query.includes("categoryId=accessories"),
      ),
    )
    .toBe(true);

  await page.getByRole("link", { name: /Everyday tote/ }).click();
  await expect(
    page.getByRole("heading", { name: "Everyday tote" }),
  ).toBeVisible();
  await expect(page.getByText("Test Vendor")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in to add to cart" }),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${storefront}/en`);
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("searchbox", { name: "Search products" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("storefront-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`${storefront}/en/signup?intent=vendor`);
  await expect(
    page.getByRole("heading", { name: "Apply to sell" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("admin and vendor workspaces keep operational navigation readable on mobile", async ({
  page,
}, testInfo) => {
  await page.goto(`${storefront}/en/login`);
  await page.getByLabel("Email").fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(`${admin}/en`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${admin}/en/orders`);
  await expect(
    page.getByRole("navigation", { name: "Admin sections" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No orders found" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("admin-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: testInfo.outputPath("admin-desktop.png"),
    fullPage: true,
  });

  await page.context().clearCookies();
  await page.goto(`${storefront}/en/login`);
  await page.getByLabel("Email").fill("vendor@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(`${vendor}/en`);
  await expect(
    page.getByRole("heading", { name: "Test Vendor" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Create a product" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No products yet" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("vendor-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 700 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("vendor-mobile.png"),
    fullPage: true,
  });
});
