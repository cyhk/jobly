DROP TABLE jobs;
DROP TABLE companies;

CREATE TABLE companies (
  handle text NOT NULL PRIMARY KEY,
  name text NOT NULL UNIQUE,
  employees int CHECK (employees >= 0),
  description text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT ''
);

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title text NOT NULL,
  salary float NOT NULL CHECK (salary >= 0),
  equity float NOT NULL CHECK (equity <= 1 AND equity >=0),
  company_handle text NOT NULL REFERENCES companies (handle) ON DELETE CASCADE,
  date_posted timestamp with time zone NOT NULL DEFAULT current_timestamp
);

-- CREATE TABLE users (

-- )