/** User class for message.ly */

/** User of the site. */
const db = require('../db');
const ExpressError = require('../expressError');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require('../config');

class User {
  constructor(username, password, first_name, last_name, phone) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
  }
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register(newUsername, newPassword, newFirst_name, newLast_name, newPhone) {
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING first_name, last_name, username, join_at`,
      [newUsername, hashedPassword, newFirst_name, newLast_name, newPhone]
    );

    const { username, first_name, last_name, phone } = result.rows[0];

    return new User(username, first_name, last_name, phone);
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(`SELECT password FROM users WHERE username = $1`, [username]);
    let user = result.rows[0];

    return user && (await bcrypt.compare(password, user.password));
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp() {
    await db.query(`UPDATE users SET last_login_at = current_timestamp WHERE username = $1 RETURNING username`, [this.username]);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`);

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  static async get(username) {
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`, [username]);

    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id, m.to_username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
      FROM messages AS m
      JOIN users AS u ON m.to_username = u.username
      WHERE to_username = $1`,
      [username]
    );

    let msg = result.rows;
    if (!msg) {
      throw new ExpressError(`No messages to ${username}`, 404);
    }

    return msg.map((m) => ({
      id: m.id,
      from_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */
  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id, m.from_username, u.first_name, u.last_name, u.phone, m.body, m.sent_at, m.read_at
        FROM messages AS m
        JOIN users AS u ON m.to_username = u.username
        WHERE to_username = $1`,
      [username]
    );

    let msg = result.rows;
    if (!msg) {
      throw new ExpressError(`No messages to ${username}`, 404);
    }

    return msg.map((m) => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }
}

module.exports = User;
