const ExpressError = require("../helpers/expressError");
const { SECRET_KEY } = require("../config");
const jwt = require("jsonwebtoken");

/** Middleware: Authenticate user. */
function authenticateJWT(req, res, next) {
  try {
    const tokenFromBody = req.body._token || req.query._token;
    const payload = jwt.verify(tokenFromBody, SECRET_KEY);

    req.user = payload; // create a current user
    return next();
  } catch (err) {
    return next();
  }
}

function ensureLoggedIn(req, res, next) {
  if (!req.user) {
    let err = new ExpressError("Unauthorized", 401);
    return next(err);
  } else {
    return next();
  }
}

function isAdmin(req, res, next) {
  try {
    if (!req.user.is_admin) {
      throw new ExpressError("Unauthorized", 401);
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  isAdmin
};