/** 
 * Job class for jobly
 */
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const { sqlForPartialUpdate, 
        searchQuery, 
        createValues 
      } = require('../helpers/queryHelpers');

class Job {
  /**
   * Create a record of the job in the database.
   * 
   * Input: { title, salary, equity, company_handle }
   * Output: { id, title, salary, equity, company_handle, date_posted }
   */
  static async create(details) {
    const expectedCols = ["id", "title", "salary", 
      "equity", "company_handle", "date_posted"];
    const { query, values } = createValues(details, "jobs", expectedCols);
    const result = await db.query(query, values);

    return result.rows[0];
  }

  /**
   * Get all jobs. If no filters match, return all jobs
   * 
   * Input: { [search], [min_salary], [min_equity] }
   * Output: [{ title, company_handle }, ...]
   */
  static async all(filters) {
    const { min_salary, min_equity } = filters;
    const filterWithNames = {
      search_title: filters.search,
      min_salary: isNaN(min_salary)? min_salary: Number(min_salary),
      min_equity: isNaN(min_equity)? min_equity: Number(min_equity)
    }

    const selectCols = ["title", "company_handle"];
    const { query, values } = searchQuery(filterWithNames,
                                          selectCols,
                                          "jobs");

    const result = await db.query(query, values);
    
    return result.rows;
  }

  /**
   * Get a specific job.
   * 
   * Input: id
   * Output: { id, title, salary, equity, company_handle, date_posted }
   * 
   * Throws an error if job is not found
   */
  static async get(id) {
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle, date_posted
        FROM jobs
        WHERE id = $1`,
        [id]
    );

    if (result.rowCount === 0) {
      throw new ExpressError("Job not found", 404);
    }

    return result.rows[0];
  }

  /**
   * Update a specific job.
   * 
   * Input: handle, {[title], [salary], [equity]}
   * Output: { id, title, salary, equity, company_handle, date_posted }
   * 
   * Throws an error if job is not found
   */
  static async update(id, valsToUpdate) {
    const { query, values } = sqlForPartialUpdate("jobs",
                                    valsToUpdate, "id", id);
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      throw new ExpressError("Job not found", 404);
    }

    return result.rows[0];
  }

  /**
   * Deletes a specific job.
   * 
   * Input: id
   * Returns { message: "Job deleted" } upon success
   * 
   * Throws an error if job is not found
   */
  static async delete(id) {
    const result = await db.query(
      `DELETE FROM jobs
        WHERE id = $1
        RETURNING id;
      `,
      [id]
    )
    if (result.rowCount === 0) {
      throw new ExpressError("Job not found", 404);
    }

    return "Job deleted";
  }
}

module.exports = Job;