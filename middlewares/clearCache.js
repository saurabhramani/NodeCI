const { clearHash } = require("../services/cache");

module.exports = (req, res, next) => {
  res.on("finish", () => {
    clearHash(req.user.id);
  });
  next();
};
