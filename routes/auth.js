const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const ExpressError = require('../expressError');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async function (req, res, next) {
  try {
    const { username, password } = req.body;
    // compare then sign
    if (await User.authenticate(username, password)) {
      const token = jwt.sign({ username }, SECRET_KEY);
      User.updateLoginTimestamp(username);
      return res.json({ message: 'Logged in.', token });
    } else {
      throw new ExpressError('Invaild username/Password', 404);
    }
  } catch (error) {
    return next(error);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function (req, res, next) {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    const user = await User.register(username, password, first_name, last_name, phone);
    const token = jwt.sign({ user }, SECRET_KEY);
    await user.updateLoginTimestamp();
    return res.json({ message: 'Account registered!', token });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
