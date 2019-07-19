const express = require("express");
const ExpressError = require("../helpers/expressError");
const User = require("../models/user");
const jsonschema = require("jsonschema");
const userSchema = require("../schemas/userSchema.json");
const userPatchSchema = require("../schemas/userPatchSchema.json");
const cleanItems = require("../helpers/cleanItems");
const router = new express.Router();

/**
 * GET / - get all users 
 * 
 * Output: {users: [{ username, first_name, last_name, email }, ...]}
 */
router.get('/', async function(req, res, next){
  try{
    const users = await User.all();

    return res.json({ users });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /:username - retrieves a specfic user
 * 
 * Output: { user: { username, first_name, last_name, email, photo_url }}
 * 
 * Throws an error if user is not found
 */
router.get('/:username', async function(req, res, next){
  try{
    const username = req.params.username;
    const user = await User.get(username);

    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST / - creates a new user based on given information.
 * 
 * Input: { username, password, first_name, last_name, email, [photo_url] }
 * Output: { user: { username, first_name, last_name, email, photo_url }}
 * 
 * Throws an error if information given is incorrect
 */
router.post('/', async function(req, res, next){
  try{
    const result = jsonschema.validate(req.body, userSchema);
    
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const expectedKeys = ["username", "password", "first_name",
                          "last_name", "email", "photo_url"];
    const detailsToAdd = req.body;
    const details = cleanItems(detailsToAdd, expectedKeys);
    const user = await User.create(details);

    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /:username - updates existing user
 * 
 * Input: { [password], [first_name], [last_name], [email], [photo_url] }
 * Output: { user: { username, first_name, last_name, email, photo_url }}
 * 
 * Throw an error if user is not found
 */
router.patch('/:username', async function(req, res, next){
  try{
    const result = jsonschema.validate(req.body, userPatchSchema);
    
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const expectedKeys = ["password", "first_name",
                          "last_name", "email", "photo_url"];
    const username = req.params.username;
    const colsToUpdate = req.body;
    const cleanedColsToUpdate = cleanItems(colsToUpdate, expectedKeys);
    const user = await User.update(username, cleanedColsToUpdate);

    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /:username - removes an existing user
 * 
 * Output: { message: "User deleted" }
 * 
 * Throws an error if user is not found
 */
router.delete('/:username', async function(req, res, next){
  try{
    const username = req.params.username;
    const message = await User.delete(username);

    return res.json({ message });
  } catch (err) {
    next(err);
  }
});

module.exports = router;