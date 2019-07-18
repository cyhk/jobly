CREATE TABLE companies (
  handle text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  num_employees int CHECK (num_employees >= 0) DEFAULT 0,
  description text,
  logo_url text
);

-- CREATE TABLE jobs (

-- )

-- CREATE TABLE users (

-- )