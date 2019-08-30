const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const { sqlForPartialUpdate,
  createValues
} = require('../helpers/queryHelpers');

class User {
  /**
   * Create a record of the user in the database.
   * Input: { username, password, first_name, last_name, email, [photo_url], [is_admin] }
   * Output: { token }
   */
  static async create(details) {
    const expectedCols = ["username", "first_name", "last_name",
      "email", "photo_url"];

    details.password = await bcrypt.hash(details.password, BCRYPT_WORK_FACTOR);

    const { query, values } = createValues(details, "users", expectedCols);
    const result = await db.query(query, values);

    return result.rows[0];
  }

  /**
   * Get all users. 
   * 
   * Output: [{ username, first_name, last_name, email }, ...]
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
   * Input: username
   * Output: { username, first_name, last_name, email, photo_url }
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
   * Input: username, {[password], [first_name], [last_name], 
   *                    [email], [photo_url]}
   * Output: { username, first_name, last_name, email, photo_url }
   * 
   * Throws an error if user is not found
   */
  static async update(usr, valsToUpdate) {
    if (valsToUpdate["password"] !== undefined) {
      valsToUpdate.password = await bcrypt.hash(valsToUpdate.password, BCRYPT_WORK_FACTOR);
    }

    const { query, values } = sqlForPartialUpdate("users",
      valsToUpdate, "username", usr);
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      throw new ExpressError("User not found", 404);
    }

    const { username, first_name, last_name,
      email, photo_url } = result.rows[0];
    const updatedUser = {
      username,
      first_name,
      last_name,
      email,
      photo_url
    }

    return updatedUser;
  }

  /**
   * Deletes a specific user.
   * 
   * Input: username
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
    )
    if (result.rowCount === 0) {
      throw new ExpressError("User not found", 404);
    }

    return "User deleted";
  }

  /**
   * Verify if the username and password combination is correct
   * 
   * Input: username, password
   * Output: is_admin
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

    let hashedPassword = result.rows[0].password;

    return (await bcrypt.compare(password, hashedPassword));
  }

  /**
   * Gets is_admin status of user
   * 
   * Input: username
   * Output: is_admin
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