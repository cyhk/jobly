const express = require("express");
const Company = require("../models/company");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const companySchema = require("../schemas/companySchema.json");
const companyPatchSchema = require("../schemas/companyPatchSchema.json");
const cleanItems = require("../helpers/cleanItems");
const { ensureLoggedIn, isAdmin } = require("../helpers/authMiddleware");
const router = new express.Router();

/**
 * GET / - get all companies matching filters, if any.
 * Returns all companies if there are no filters
 *
 * filters: { [search], [min_employees], [max_equity] }
 *
 * Output: { companies: [{handle (string), name (string)}, ...]}
 */
router.get("/", async function (req, res, next) {
  try {
    if (req.user) {
      const neededKeys = ["search", "min_employees", "max_employees"];
      const filters = req.query;
      const cleanedFilters = cleanItems(filters, neededKeys);
      const companies = await Company.all(cleanedFilters);

      return res.json({ companies });
    } else {
      throw new ExpressError("Unauthorized", 401);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /:handle - retrieves a specfic company
 *
 * Output: { company: { handle (string), name (string), employees (number), description (string), logo_url (string) }
 *
 * Throws an error if company is not found
 */
router.get("/:handle", async function (req, res, next) {
  try {
    if (req.user) {
      const handle = req.params.handle;
      const company = await Company.get(handle);

      return res.json({ company });
    } else {
      throw new ExpressError("Unauthorized", 401);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST / - creates a new company based on given information.
 *
 * Input: { handle (string), name (string), [employees (number)], [description (string)], [logo_url (string)] }
 * Output: { company: { handle (string), name (string), employees (number), description (string), logo_url (string) }}
 *
 * Throws an error if information given is incorrect
 */
router.post("/", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    const result = jsonschema.validate(req.body, companySchema);

    if (!result.valid) {
      let listOfErrors = result.errors.map((error) => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const expectedKeys = [
      "handle",
      "name",
      "employees",
      "description",
      "logo_url",
    ];
    const detailsToAdd = req.body;
    const details = cleanItems(detailsToAdd, expectedKeys);
    const company = await Company.create(details);

    return res.json({ company });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /:handle - updates existing company
 *
 * Input: { [name (string)], [employees (number)], [description (string)], [logo_url (string)] }
 * Output: { company: { handle (string), name (string), employees (number), description (string), logo_url (string) }}
 *
 * Throw an error if company is not found, or if information
 * given is incorrect
 */
router.patch("/:handle", ensureLoggedIn, isAdmin, async function (
  req,
  res,
  next
) {
  try {
    const result = jsonschema.validate(req.body, companyPatchSchema);

    if (!result.valid) {
      let listOfErrors = result.errors.map((error) => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const expectedKeys = ["name", "employees", "description", "logo"];
    const handle = req.params.handle;
    const colsToUpdate = req.body;
    const cleanedColsToUpdate = cleanItems(colsToUpdate, expectedKeys);
    const company = await Company.update(handle, cleanedColsToUpdate);

    return res.json({ company });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /:handle - removes an existing company
 *
 * Output: { message: "Company deleted" }
 *
 * Throws an error if company is not found
 */
router.delete("/:handle", ensureLoggedIn, isAdmin, async function (
  req,
  res,
  next
) {
  try {
    const handle = req.params.handle;
    const message = await Company.delete(handle);

    return res.json({ message });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
