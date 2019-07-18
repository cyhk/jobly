/** 
 * Company class for jobly
 */

require('dotenv').config();

const db = require("../db");
const ExpressError = require("../helpers/expressError");
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Company {
  
  /**
   * Create a record of the company in the database.
   * Returns {handle, name, num_employees, description, logo_url}
   */
  static async create(details) {
    try{
      //make into const/etc. if similar code later?
      const expectedKeys = ["handle", "name", "num_employees", "description", "logo_url"];

      //abstract if similar code later?
      const vals = [];
      for (let key of expectedKeys) {
        if(details[key] === undefined) {
          vals.push(null);
        }
        else {
          vals.push(details[key]);
        }
      }

      const result = await db.query(
        `INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING handle, name, num_employees, description, logo_url;
        `,
        vals
      );

      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get all companies.
   * Returns [{handle, name}, ...]
   */
  static async all(filters) {
    try {
      const query = makeQuery(filters);
      const result = await db.query(
        `SELECT handle, name
          FROM companies
          ${query}`
      );

      return result.rows;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get a specific company.
   * Returns {handle, name, num_employees, description, logo_url}
   * 
   * Throws an error if company is not found
   */
  static async get(handle) {
    try{
      const result = await db.query(
        `SELECT handle, name, num_employees, description, logo_url
          FROM companies
          WHERE handle = $1`,
          [handle]
      );

      if (result.rowCount === 0) {
        throw new ExpressError("Company not found", 404);
      }

      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  /**
   * Update a specific company.
   * Returns {handle, name, num_employees, description, logo_url}
   * 
   * Throws an error if company is not found
   */
  static async update(handle, valsToUpdate) {
    try {
      const { query, values } = sqlForPartialUpdate("companies", valsToUpdate, "handle", handle);
      const result = await db.query(query, values);

      if (result.rowCount === 0) {
        throw new ExpressError("Company not found", 404);
      }

      return result.rows[0];
    } catch (err) {
      throw err
    }
  }

  /**
   * Deletes a specific company.
   * Returns {message: "Company deleted"} upon success
   * 
   * Throws an error if company is not found
   */
  static async delete(handle) {
    try {
      const result = await db.query(
        `DELETE FROM companies
          WHERE handle = $1
          RETURNING handle, name, num_employees, description, logo_url;
        `,
        [handle]
      )
      if (result.rowCount === 0) {
        throw new ExpressError("Company not found", 404);
      }

      return "Company deleted";
    } catch (err) {
      throw err;
    }
  }
}

/**
 * Helper function to make query from filters
 * when getting all companies
 */
function makeQuery(filters) {
  try{
    const { search, min_employees, max_employees } = filters;

    if (min_employees > max_employees) {
      throw new ExpressError(
        "min employees cannot be larger than max employees",
        400);
    }

    let query = '';


    if (search) {
      if (query === '') query = 'WHERE';
      
      query += ` name ILIKE '%${search}%'`;
    }

    if (min_employees) {
      if (query === '') {
        query = 'WHERE';
      }
      else {
        query += ' AND';
      }

      query += ` num_employees >= ${min_employees}`
    }

    if (max_employees) {
      if (query === '') {
        query = 'WHERE';
      }
      else {
        query += ' AND';
      }

      query += ` num_employees <= ${max_employees}`
    }

    return query;
  } catch (err) {
    throw err;
  }
}

module.exports = Company;