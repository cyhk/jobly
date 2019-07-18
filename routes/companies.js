const express = require("express");
const Company = require("../models/company");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const companySchema = require("../schemas/companySchema.json");
const companyPatchSchema = require("../schemas/companyPatchSchema.json");
const router = express.Router();

/**
 * GET / - get all companies matching filters, if any.
 * Returns all companies if there are no filters
 * 
 * Output: {companies: [{handle, name}, ...]}
 */
router.get('/', async function (req, res, next) {
  try {
    const filters = req.query;
    const companies = await Company.all(filters);

    return res.json({ companies });
  } catch (err) {
    next(err);
  }
});

/**
 * POST / - creates a new company based on given information.
 * 
 * Input: {handle, name, [num_employees], [description], [logo_url]}
 * Output: {company: {handle, name, num_employees, description, logo_url}}
 * 
 * Throws an error if information given is incorrect
 */
router.post('/', async function (req, res, next) {
  try {
    const result = jsonschema.validate(req.body, companySchema);
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const { handle, name, num_employees, description, logo_url } = req.body;
    const details = { handle, name, num_employees, description, logo_url };
    const company = await Company.create(details);
    return res.json({ company });
  } catch (err) {
    next(err);
  }
})

/**
 * GET /:handle - retreves a specfic company
 * Output: {company: {handle, name, num_employees, description, logo_url}}
 * 
 * Throws an error if company is not found
 */
router.get('/:handle', async function (req, res, next) {
  try {
    const handle = req.params.handle;
    const company = await Company.get(handle);

    return res.json({ company });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /:handle - updates existing company
 * Input: {handle, [name], [num_employees], [description], [logo_url]}
 * Output: {company:{handle, name, num_employees, description, logo_url}}
 * 
 * Throw an error if company is not found, or if information
 * given is incorrect
 */
router.patch('/:handle', async function(req, res, next) {
  try{
    const result = jsonschema.validate(req.body, companyPatchSchema);
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const handle = req.params.handle;
    const valsToUpdate = req.body;
    const company = await Company.update(handle, valsToUpdate);

    return res.json({ company });
  } catch (err) {
    console.log(err);
    next(err);
  }
})

/**
 * DELETE /:handle - removes an existing company and 
 * Output: {message: "Company deleted"}
 * 
 * Throws an error if company is not found
 */
router.delete('/:handle', async function(req, res, next) {
  try{
    const handle = req.params.handle;
    const message = await Company.delete(handle);

    return res.json({ message });
  } catch (err) {
    next(err);
  }
})


module.exports = router;