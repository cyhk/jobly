const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const {
  sqlForPartialUpdate,
  createValues,
} = require("../helpers/queryHelpers");

class User {
  /**
   * Create a record of the user in the database.
   * Input: { username (string), password (string), first_name (string), last_name (string),
   *          email (string), [photo_url (string)], [is_admin (boolean)] }
   * Output: { username (string), first_name (string), last_name (string), email (string), photo_url (string) }
   */
  static async create(details) {
    const expectedCols = [
      "username",
      "first_name",
      "last_name",
      "email",
      "photo_url",
    ];

    details.password = await bcrypt.hash(details.password, BCRYPT_WORK_FACTOR);

    const { query, values } = createValues(details, "users", expectedCols);
    const result = await db.query(query, values);

    return result.rows[0];
  }

  /**
   * Get all users.
   *
   * Output: [{ username (string), first_name (string), last_name (string), email (string) }, ...]
   */
  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, email
        FROM users
      `
    );

    return result.rows;
  }

  /**
   * Get a specific user.
   *
   * Input: username (string)
   * Output: { username (string), first_name (string), last_name (string), email (string), photo_url (string) }
   *
   * Throws an error if user is not found
   */
  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, email, photo_url
        FROM users
        WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      throw new ExpressError("User not found", 404);
    }

    return result.rows[0];
  }

  /**
   * Update a specific user.
   *
   * Input: username (string), {[password (string)], [first_name (string)], [last_name (string)],
   *                            [email (string)], [photo_url (string)]}
   * Output: { username (string), first_name (string), last_name (string), email (string), photo_url (string) }
   *
   * Throws an error if user is not found
   */
  static async update(usr, valsToUpdate) {
    if (valsToUpdate["password"] !== undefined) {
      valsToUpdate.password = await bcrypt.hash(
        valsToUpdate.password,
        BCRYPT_WORK_FACTOR
      );
    }

    const { query, values } = sqlForPartialUpdate(
      "users",
      valsToUpdate,
      "username",
      usr
    );
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      throw new ExpressError("User not found", 404);
    }

    const {
      username,
      first_name,
      last_name,
      email,
      photo_url,
    } = result.rows[0];
    const updatedUser = {
      username,
      first_name,
      last_name,
      email,
      photo_url,
    };

    return updatedUser;
  }

  /**
   * Deletes a specific user.
   *
   * Input: username (string)
   * Returns { message: "User deleted" } upon success
   *
   * Throws an error if user is not found
   */
  static async delete(username) {
    const result = await db.query(
      `DELETE FROM users
        WHERE username = $1
        RETURNING username;
      `,
      [username]
    );
    if (result.rowCount === 0) {
      throw new ExpressError("User not found", 404);
    }

    return "User deleted";
  }

  /**
   * Verify if the username and password combination is correct
   *
   * Input: username (string), password (string)
   * Output: none (undefined)
   *
   * Throws an error if invalid credentials
   */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      throw new ExpressError("Invalid username or password.", 400);
    }

    let hashedStoredPassword = result.rows[0].password;

    let passwordResult = await bcrypt.compare(password, hashedStoredPassword);

    if (!passwordResult) {
      throw new ExpressError("Invalid username or password.", 400);
    }
  }

  /**
   * Gets is_admin status of user
   *
   * Input: username (string)
   * Output: is_admin (boolean)
   *
   * Throws an error if user not found
   */
  static async getAdminStatus(username) {
    const result = await db.query(
      `SELECT is_admin
        FROM users
        WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      throw new ExpressError("User not found", 404);
    }

    return result.rows[0].is_admin;
  }
}

module.exports = User;
