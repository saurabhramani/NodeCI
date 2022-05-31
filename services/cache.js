const mongoose = require("mongoose");
const { createClient } = require("redis");

const client = createClient();

client.on("error", (error) => console.error("redis error: ", error));

client.connect();

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.hashKey = JSON.stringify(options.key);
  this.isCached = true;
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.isCached) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  const cachedValue = await client.hGet(this.hashKey, key);

  //   console.log(
  //     `hashKey: ${this.hashKey}, key: ${key}, cachedValue: ${cachedValue}`
  //   );

  if (cachedValue) {
    const doc = JSON.parse(cachedValue);
    return Array.isArray(doc)
      ? doc.map((item) => new this.model(item))
      : new this.model(doc);
  }

  const result = await exec.apply(this, arguments);
  await client.hSet(this.hashKey, key, JSON.stringify(result));
  return result;
};

module.exports = {
  clearHash(key) {
    client.del(JSON.stringify(key));
  },
};
