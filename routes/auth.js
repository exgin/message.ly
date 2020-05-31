const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const ExpressError = require('../expressError');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function (req, res, next) {
  try {
    const user = await User.register(req.body);
    const token = jwt.sign({ user }, SECRET_KEY);
    user.updateLoginTimestamp();
    return res.json(token);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
