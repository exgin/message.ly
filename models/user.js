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
    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users WHERE username = $1`, [username]);
    const users = results.rows.map((r) => new User(r.username, r.first_name, r.last_name, r.phone));

    return users;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {}

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {}

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {}
}

module.exports = User;
