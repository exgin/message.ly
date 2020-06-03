const express = require('express');
const router = new express.Router();
const Message = require('../models/message');
const { ensureLoggedIn } = require('../middleware/auth');
const ExpressError = require('../expressError');
// ROUTES

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async function (req, res, next) {
  try {
    const username = req.user.username;
    const msg = await Message.get(req.params.id);

    // the recevier & sender must be vaild
    if (msg.to_user.username !== username && msg.from_user.username !== username) {
      throw new ExpressError('Error reading this message selected. Try another one.', 401);
    }
  } catch (error) {
    return next(error);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async function (req, res, next) {
  try {
    // unauthorzied error when sending messages? -> MUST include _token in req.body
    const msg = await Message.create({ from_username: req.user.username, to_username: req.body.to_username, body: req.body.body });

    return res.json({ message: msg });
  } catch (error) {
    return next(error);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async function (req, res, next) {
  try {
    const username = req.user.username;
    const msg = await Message.get(req.params.id);

    if (msg.to_user.username !== username) {
      throw new ExpressError("Can't set this message to read.", 401);
    }
    const readMsg = await Message.markRead(req.params.id);
    return res.json({ readMsg });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
