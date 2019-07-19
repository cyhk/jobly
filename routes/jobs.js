const express = require("express");
const Job = require("../models/job");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const jobSchema = require("../schemas/jobSchema.json");
const jobPatchSchema = require("../schemas/jobPatchSchema.json");
const cleanItems = require("../helpers/cleanItems");
const router = new express.Router();

/**
 * GET / - get all jobs matching filters, if any.
 * Returns all jobs if there are no filters.
 * 
 * filters: { [search], [min_salary], [min_equity] }
 * 
 * Output: {jobs: [{ title, company_handle }, ...]}
 */
router.get('/', async function(req, res, next){
  try{
    const expectedKeys = ["search", "min_salary", "min_equity"];
    const filters = req.query;
    const cleanedFilters = cleanItems(filters, expectedKeys);
    const jobs = await Job.all(cleanedFilters);

    return res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /:id - retrieves a specfic job
 * 
 * Output: { job: { id, title, salary, equity, company_handle, date_posted }}
 * 
 * Throws an error if job is not found
 */
router.get('/:id', async function(req, res, next){
  try{
    const id = req.params.id;
    const job = await Job.get(id);

    return res.json({ job });
  } catch (err) {
    next(err);
  }
});

/**
 * POST / - creates a new job based on given information.
 * 
 * Input: { title, salary, equity, company_handle }
 * Output: { job: { id, title, salary, equity, company_handle, date_posted }}
 * 
 * Throws an error if information given is incorrect
 */
router.post('/', async function(req, res, next){
  try{
    const result = jsonschema.validate(req.body, jobSchema);
    
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const expectedKeys = ["title", "salary", "equity", "company_handle"];
    const detailsToAdd = req.body;
    const details = cleanItems(detailsToAdd, expectedKeys);
    const job = await Job.create(details);

    return res.json({ job });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /:id - updates existing job
 * 
 * Input: { [title], [salary], [equity] }
 * Output: { job: { id, title, salary, equity, company_handle, date_posted }}
 * 
 * Throw an error if job is not found, or if information
 * given is incorrect
 */
router.patch('/:id', async function(req, res, next){
  try{
    const result = jsonschema.validate(req.body, jobPatchSchema);
    
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }
    
    const expectedKeys = ["title", "salary", "equity"];
    const id = req.params.id;
    const colsToUpdate = req.body;
    const cleanedColsToUpdate = cleanItems(colsToUpdate, expectedKeys);
    const job = await Job.update(id, cleanedColsToUpdate);

    return res.json({ job });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /:id - removes an existing job
 * 
 * Output: { message: "Job deleted" }
 * 
 * Throws an error if job is not found
 */
router.delete('/:id', async function(req, res, next){
  try{
    const id = req.params.id;
    const message = await Job.delete(id);

    return res.json({ message });
  } catch (err) {
    next(err);
  }
});

module.exports = router;