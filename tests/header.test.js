const keys = require("../config/keys");
const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto(keys.serverUrl);
});

afterEach(async () => {
  await page.close();
});

test("the header has the correct text", async () => {
  const text = await page.$eval("a.brand-logo", (element) => element.innerText);
  expect(text).toEqual("Blogster");
});

test("cliking on login to enter oauth flow", async () => {
  await page.click(".right a");
  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test("When signed in, shows logout button", async () => {
  await page.login();

  const logoutText = await page.$eval(
    'a[href="/auth/logout"]',
    (element) => element.innerHTML
  );

  expect(logoutText).toEqual("Logout");
});

// test('', async() => {})
