const puppeteer = require("puppeteer");
const keys = require("../../config/keys");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class Page {
  static async build() {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    const CustomPage = new Page(page);

    const superPage = new Proxy(CustomPage, {
      get: function (target, property) {
        return CustomPage[property] || browser[property] || page[property];
      },
    });

    return superPage;
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    await this.page.goto(keys.serverUrl);
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({
      name: "session",
      value: session,
    });
    await this.page.setCookie({ name: "session.sig", value: sig });
    await this.page.goto(`${keys.serverUrl}/blogs`);
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  get(path) {
    return this.page.evaluate((url) => {
      return fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "My Title", content: "My Content" }),
      }).then((res) => res.json());
    }, this.getUrl(path));
  }

  post(path, data) {
    return this.page.evaluate(
      (url, _data) => {
        return fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(_data),
        }).then((res) => res.json());
      },
      this.getUrl(path),
      data
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => this[method](path, data))
    );
  }

  getUrl(path) {
    return path.includes("http") ? path : `${keys.serverUrl}${path}`;
  }
}

module.exports = Page;
