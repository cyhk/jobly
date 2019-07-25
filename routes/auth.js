const express = require("express");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");
const router = new express.Router();

/**
 * POST /login - logs the user in
 * Returns a JWT token
 * 
 * Output: { token: token }
 */
router.post('/login', async function (req, res, next) {
  try {
    const { username, password } = req.body;
    // if credentials are not correct, User.authenticate should throw an error
    await User.authenticate(username, password);
    
    const is_admin = await User.getAdminStatus(username);

    let payload = { username, is_admin };
    let token = jwt.sign(payload, SECRET_KEY);

    return res.json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;