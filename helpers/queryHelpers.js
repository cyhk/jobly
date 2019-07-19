/**
 * Makes query to select for rows based on given filters
 * 
 * Returns { query, values }
 */
function searchQuery(filters, selectCols, table) {
  let idx = 1;
  let cols = [];
  let values = [];

  for (let name in filters) {
    if (filters[name] !== undefined) {
      actionTerm = name.split('_');
      if (typeof filters[name] === "string") {
        cols.push(`${actionTerm[1]} ILIKE $${idx}`);
        values.push(`%${filters[name]}%`);
      }
      else if (typeof filters[name] === "number") {
        if (actionTerm[0].includes("min")) {
          cols.push(`${actionTerm[1]} >= $${idx}`);
          values.push(filters[name]);
        }
        else if (actionTerm[0].includes("max")) {
          cols.push(`${actionTerm[1]} <= $${idx}`);
          values.push(filters[name]);
        }
      }
      idx++;
    }
  }

  let columns = cols.join(" AND ");
  let selectColumns = selectCols.join(", ");
  let query = `SELECT ${selectColumns} FROM ${table}`;

  if (columns !== "") {
    query += ` WHERE ${columns}`;
  }
  
  return { query, values };
}

/**
 * Makes query for inserting row into table
 * 
 * Returns { query, values }
 */
function createValues(details, table, allColumns) {
  let idx = 1;
  let cols = Object.keys(details);
  let indices = [];
  let values = [];
  
  for (let key in details) {
    values.push(details[key]);
    indices.push(`$${idx++}`);
  }

  let columns = cols.join(', ');
  let idxArr = indices.join(', ');
  let allCols = allColumns.join(', ');

  let query = `INSERT INTO ${table} (${columns}) VALUES (${idxArr})`
  query += ` RETURNING ${allCols}`

  return { query, values };
}

/**
 * Generate a selective update query based on a request body:
 *
 * - table: where to make the query
 * - items: an object with keys of columns you want to update and values with
 *          updated values
 * - key: the column that we query by (e.g. username, handle, id)
 * - id: current record ID
 *
 * Returns object containing a DB query as a string, and array of
 * string values to be updated
 *
 */
function sqlForPartialUpdate(table, items, key, id) {
  // keep track of item indexes
  // store all the columns we want to update and associate with vals

  let idx = 1;
  let columns = [];

  // filter out keys that start with "_" -- we don't want these in DB
  for (let key in items) {
    if (key.startsWith("_")) {
      delete items[key];
    }
  }

  for (let column in items) {
    columns.push(`${column}=$${idx}`);
    idx += 1;
  }

  // build query
  let cols = columns.join(", ");
  let query = `UPDATE ${table} SET ${cols} WHERE ${key}=$${idx} RETURNING *`;

  let values = Object.values(items);
  values.push(id);

  return { query, values };
}

module.exports = { searchQuery, createValues, sqlForPartialUpdate };