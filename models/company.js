/**
 * Company class for jobly
 */
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const {
  sqlForPartialUpdate,
  searchQuery,
  createValues,
} = require("../helpers/queryHelpers");

class Company {
  /**
   * Create a record of the company in the database.
   *
   * Input: { handle (string), name (string), [employees (number)], [description (string)], [logo_url (string)] }
   * Output: {handle (string), name (string), employees (number), description (string), logo_url (string)}
   */
  static async create(details) {
    const expectedCols = [
      "handle",
      "name",
      "employees",
      "description",
      "logo_url",
    ];
    const { query, values } = createValues(details, "companies", expectedCols);
    const result = await db.query(query, values);

    return result.rows[0];
  }

  /**
   * Get all companies. If no filters match, returns all companies
   *
   * Input: { [search (string)], [min_employees (number as string)], [max_employees (number as string)] }
   * Output: [{handle (string), name (string)}, ...]
   */
  static async all(filters) {
    const { min_employees, max_employees } = filters;
    const filterWithNames = {
      search_name: filters.search,
      min_employees: isNaN(min_employees)
        ? min_employees
        : Number(min_employees),
      max_employees: isNaN(max_employees)
        ? max_employees
        : Number(max_employees),
    };

    if (Number(min_employees) > Number(max_employees)) {
      throw new ExpressError(
        "Min employees cannot be larger than max employees",
        400
      );
    }

    const selectCols = ["handle", "name"];
    const { query, values } = searchQuery(
      filterWithNames,
      selectCols,
      "companies"
    );

    const result = await db.query(query, values);

    return result.rows;
  }

  /**
   * Get a specific company.
   *
   * Input: handle (string)
   * Output: { handle (string), name (string), employees (number), description (string), logo_url (string) }
   *
   * Throws an error if company is not found
   */
  static async get(handle) {
    const companyResult = await db.query(
      `SELECT handle, name, employees, description, logo_url
        FROM companies
        WHERE handle = $1`,
      [handle]
    );

    if (companyResult.rowCount === 0) {
      throw new ExpressError("Company not found", 404);
    }

    const company = companyResult.rows[0];

    const jobResult = await db.query(
      `SELECT id, title, date_posted
        FROM jobs
        JOIN companies ON company_handle = handle
        WHERE handle = $1`,
      [handle]
    );

    company.jobs = jobResult.rows;

    return company;
  }

  /**
   * Update a specific company.
   *
   * Input: handle (string), {[name (string)], [employees (number)], [description (string)], [logo_url (string)]}
   * Output: { handle (string), name (string), employees (number), description (string), logo_url (string) }
   *
   * Throws an error if company is not found
   */
  static async update(handle, valsToUpdate) {
    const { query, values } = sqlForPartialUpdate(
      "companies",
      valsToUpdate,
      "handle",
      handle
    );
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      throw new ExpressError("Company not found", 404);
    }

    return result.rows[0];
  }

  /**
   * Deletes a specific company.
   *
   * Input: handle (string)
   * Output: {message: "Company deleted"} upon success
   *
   * Throws an error if company is not found
   */
  static async delete(handle) {
    const result = await db.query(
      `DELETE FROM companies
        WHERE handle = $1
        RETURNING handle;
      `,
      [handle]
    );
    if (result.rowCount === 0) {
      throw new ExpressError("Company not found", 404);
    }

    return "Company deleted";
  }
}

module.exports = Company;
