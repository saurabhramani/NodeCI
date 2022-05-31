const Page = require("./helpers/page");

let page;
beforeEach(async () => {
  page = await Page.build();
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("You can see the  form", async () => {
    const labelText = await page.$eval("form label", (el) => el.innerHTML);
    expect(labelText).toEqual("Blog Title");
  });

  describe("And using invalid input", async () => {
    beforeEach(async () => {
      await page.click("form button");
    });

    test("You can see the error message", async () => {
      const title = await page.$eval(".title .red-text", (el) => el.innerHTML);
      const content = await page.$eval(
        ".content .red-text",
        (el) => el.innerHTML
      );

      expect(title).toEqual("You must provide a value");
      expect(content).toEqual("You must provide a value");
    });
  });

  describe("And using valid input", async () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const text = await page.$eval("form h5", (el) => el.innerHTML);
      expect(text).toEqual("Please confirm your entries");
    });

    test("Submitting then saving adds blog to index page", async () => {
      await page.click("button.green");
      await page.waitFor(".card");
      const title = await page.$eval(".card-title", (el) => el.innerHTML);
      const content = await page.$eval("p", (el) => el.innerHTML);
      expect(title).toEqual("My Title");
      expect(content).toEqual("My Content");
    });
  });
});

describe.only("User is not logged in", async () => {
  const actions = [
    {
      method: "get",
      path: "/api/blogs",
    },
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "T",
        content: "C",
      },
    },
  ];

  test("Blogs related actions are prohibited", async () => {
    const results = await page.execRequests(actions);    
    for (let result of results) {
      expect(result).toEqual({ error: "You must log in!" });
    }
  });
});
