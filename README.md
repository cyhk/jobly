# Jobly

A backend for a job board built with Node, Express, with a PostgreSQL database.

A deployed version of this backend can be found [here](https://cyhk-jobly.herokuapp.com). For the heroku app, you can create your own User account, or use the login combinations test/testtest (User) or admin/adminadmin (Admin) to explore the api.

This project was done as a solo exercise. For the React frontend, pair programmed with [Andrew Li](https://github.com/andrewsli), visit [react-jobly](https://github.com/cyhk/react-jobly).

# Build status

[![Build Status](https://travis-ci.com/cyhk/jobly.svg?branch=master)](https://travis-ci.com/cyhk/jobly.svg?branch=master)

# Tech/framework used

**Built with:**

- Node
- Express
- PostgreSQL

# How to use

Create database and tables:

```
createdb jobly
createdb jobly-test

psql jobly < seed.sql
psql jobly-test < seed.sql
```

Install all dependencies:

```
npm install
```

To start:

```
npm start
```

To run tests:

```
jest -i --verbose
```

or alternatively, if you want to suppress the console.log output:

```
jest -i --silent --verbose
```

# API

For all routes requiring login, pass:

```
{
  _token: token (string)
}
```

that you receive when you log in or create a user.

## Companies

**POST /companies**

Access: Admin only

Creates a company in the database. Takes JSON input:

```
{
  handle (string),
  name (string),
  [employees (number)],
  [description (string)],
  [logo_url (string)],
}
```

and returns JSON:

```
{
  company: {
    handle (string),
    name (string),
    employees (number),
    description (string),
    logo_url (string)
  }
}
```

**GET /companies**

Access: All logged-in users

Returns the handle and name for all matching companies along with associated jobs. If no query string parameters are supplied, the route returns all companies. The route supports the following query string parameters:

- **search**: filters by name
- **min_employees**: filters for companies with more than or equal to min_employees
- **max_employees**: filters for companies with less than or equal to max_employees

Returns JSON:

```
{
  companies: [
    {
      handle (string),
      name (string)
    },
    ...
  ]
}
```

**GET /companies/:handle**

Access: All logged-in users

Returns company matching handle. Returns the following JSON:

```
{
  company: {
    handle (string),
    name (string),
    employees (number),
    description (string),
    logo_url (string)
  }
}
```

**PATCH /companies/:handle**

Access: Admin only

Update an existing company. Takes JSON input:

```
{
  [name (string)],
  [employees (number)],
  [description (string)],
  [logo_url (string)]
}
```

Returns JSON:

```
{
  company: {
    handle (string),
    name (string),
    employees (number),
    description (string),
    logo_url (string)
  }
}
```

**DELETE /companies/:handle**

Access: Admin only

Removes the company from the database. Returns JSON upon success:

```
{
  message: "Company deleted"
}
```

upon success.

## Jobs

**_POST /jobs_**

Access: Admin only

Creates a new job. Takes JSON input:

```
{
  title (string),
  salary (number),
  equity (number),
  company_handle (string)
}
```

returns JSON:

```
{
  job: {
    id (number),
    title (string),
    salary (number),
    equity (number),
    company_handle (string),
    date_posted (string)
  }
}
```

**_GET /jobs_**

Access: Public

List all matching jobs ordered by most recently posted. If no query string parameters are supplied, the route returns all jobs.

The following query string parameters are supported:

- **search**: filters by title
- **min_salary**: filters for jobs paying more than a specified minimum salary
- **min_equity**: filters for jobs with more than a specified minimum equity

Returns JSON:

```
{
  jobs: [
    {
      title (string),
      company_handle (string)
    },
    ...
  ]
}
```

**_GET /jobs/:id_**

Access: Public

Returns job with the specified `id` as JSON:

```
{
  job: {
    id (number),
    title (string),
    salary (number),
    equity (number),
    company_handle (string),
    date_posted (string)
  }
}
```

**_PATCH /jobs/:id_**

Access: Admin only

Updates a job matching the `id`. Takes JSON input:

```
{
  [title (string)],
  [salary (number)],
  [equity (number)]
}
```

and returns JSON:

```

{
  job: {
    id (number),
    title (string),
    salary (number),
    equity (number),
    company_handle (string),
    date_posted (string)
  }
}

```

**_DELETE /jobs/:id_**

Access: Admin only

Deletes the job with `id` from database. Returns JSON upon success:

```
{
  message: "Job deleted"
}
```

## Users

**_POST /users_**

Access: Public

Creates a new user. Takes JSON input:

```
{
  username (string),
  password (string),
  first_name (string),
  last_name (string),
  email (string),
  [photo_url (string)],
  [is_admin (boolean)]
}
```

and returns JSON:

```
{
  token: token (string)
}
```

**_GET /users_**

Access: All logged-in users

Gets list of users. Returns JSON:

```
{
  users: [
    {
      username (string),
      first_name (string),
      last_name (string),
      email (string)
    },
    ...
  ]
}
```

**_GET /users/:username_**

Access: All logged-in users

Returns user information for `username`. Returns JSON:

```
{
  users: [
    {
      username (string),
      first_name (string),
      last_name (string),
      email (string)
    },
    ...
  ]
}
```

**_PATCH /users/:username_**

Access: All logged-in users, for their own profiles only

Updates user information for `username`, Takes input

```
{
  [password (string)],
  [first_name (string)],
  [last_name (string)],
  [email (string)],
  [photo_url (string)]
}
```

and returns JSON

```
{
  user: {
    username (string),
    first_name (string),
    last_name (string),
    email (string),
    photo_url (string)
  }
}
```

**_DELETE /users/:username_**

Access: All logged-in users, for their own profiles only

Removes user with `username`. Returns JSON upon success:

```
{
  message: "User deleted"
}
```

## Authorization

**_POST /login_**

Access: Public

Authenticates a user and returns a JSON Web Token which contains a payload with the username and is_admin values.

Takes JSON input:

```
{
  username (string),
  password (string)
}
```

and returns JSON:

```
{
  token: token (string)
}
```
