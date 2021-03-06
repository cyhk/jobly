/**
 * The following was provided as starter code
 **/

/** Shared config for application; can be req'd many places. */

require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY || "test";
const TOKEN = process.env.TOKEN;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const PORT = +process.env.PORT || 3000;

let BCRYPT_WORK_FACTOR;

if (process.env.NODE_ENV === "test") {
  BCRYPT_WORK_FACTOR = 1;
} else {
  BCRYPT_WORK_FACTOR = 12;
}

// database is:
//
// - on Heroku, get from env var DATABASE_URL
// - in testing, 'jobly-test'
// - else: 'jobly'

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = "jobly-test";
} else {
  DB_URI = process.env.DATABASE_URL || "jobly";
}

module.exports = {
  SECRET_KEY,
  TOKEN,
  ADMIN_TOKEN,
  BCRYPT_WORK_FACTOR,
  PORT,
  DB_URI,
};
