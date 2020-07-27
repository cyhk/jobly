/**
 * The following was provided as starter code
 **/

/** Shared config for application; can be req'd many places. */

require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY || "test";
const TOKEN = process.env.TOKEN;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const BCRYPT_WORK_FACTOR = 12;

const PORT = +process.env.PORT || 3000;

// database is:
//
// - on Heroku, get from env var DATABASE_URL
// - in testing, 'jobly-test'
// - else: 'jobly'

let DB_URI = process.env.NODE_ENV === "test" ? "jobly-test" : "jobly";

module.exports = {
  SECRET_KEY,
  TOKEN,
  ADMIN_TOKEN,
  BCRYPT_WORK_FACTOR,
  PORT,
  DB_URI,
};
