process.env.NODE_ENV = "test";

const db = require("../../db");
const app = require("../../app");
const request = require("supertest");

describe("Test Company Routes", () => {

  describe("GET /companies/ - Gets all companies matching query parameters (if any)", () => {

    beforeEach(async function () {
      await db.query(`DELETE FROM companies`);
      await db.query(`
        INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 49, 'A test company for tests', 'https://bit.ly/2LWkdq5');
      `);

      await db.query(`
        INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('TEST2', 'Test2 Co. Ltd', 187, 'A second test company for tests', 'https://bit.ly/2JFIhMB');
      `);

      await db.query(`
        INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('TEST3', 'Test3 Co. Ltd', 15, 'A third test company for tests', 'https://bit.ly/2NVIkHV');
      `);
    });

    test("should get all companies when no filters are given",
      async function () {
        const response = await request(app)
          .get("/companies");
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({
          companies: [
            {
              handle: "TEST1",
              name: "Test1 Co. Ltd"
            },
            {
              handle: "TEST2",
              name: "Test2 Co. Ltd"
            },
            {
              handle: "TEST3",
              name: "Test3 Co. Ltd"
            }]
        });
      }
    );

    test("should get all companies when all filters are given",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ 
            search: 'Test',
            min_employees: 1,
            max_employees: 100
         });
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({
          companies: [
            {
              handle: "TEST1",
              name: "Test1 Co. Ltd"
            },
            {
              handle: "TEST3",
              name: "Test3 Co. Ltd"
            }]
        });
      }
    );

    test("filter companies by search term for name if it exists",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ search: 'Test1'
         });
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({
          companies: [
            {
              handle: "TEST1",
              name: "Test1 Co. Ltd"
            },
          ]
        });
      }
    );

    test("searching for name that does not exist should return nothing",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ search: 'asdlkfasd' });
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({ companies: [] });
      }
    );

    test("get all companies matching minimum employees",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ min_employees: 100 });
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({
          companies: [
            {
              handle: "TEST2",
              name: "Test2 Co. Ltd"
            }]
        });
      }
    );

    test("get no companies with non-matching min_employees",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ min_employees: 10000 });
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({
          companies: []
        });
      }
    );

    test("get all companies matching maximum employees",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ max_employees: 50 });
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({ companies: [{
          handle: "TEST1",
          name: "Test1 Co. Ltd"
        },
          {
            handle: "TEST3",
            name: "Test3 Co. Ltd"
          }]});
      }
    );

    test("get no companies with non-matching max_employees",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ max_employees: 1 });
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({
          companies: []
        });
      }
    );

    test("should throw an error with bad inputs", 
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ 
            max_employees: 1,
            min_employees: 10
          });
        const companies = response.body;

        expect(response.statusCode).toBe(400);
        expect(companies).toEqual({
          status: 400,
          message: "min employees cannot be larger than max employees"
        });
      }
    );
  });

  describe("POST /companies/ - creates new company", () => {
    beforeEach(async function () {
      await db.query(`DELETE FROM companies`);
      await db.query(`
        INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 49, 'A test company for tests', 'https://bit.ly/2LWkdq5');
      `);
    });

    test("should create new company",
      async function () {
        const response = await request(app)
          .post("/companies")
          .send({
            handle: "EARTH",
            name: "Planet Earth",
            num_employees: 13,
            description: "Is this a real company?"
          });
        const company = response.body;

        expect(response.statusCode).toBe(200);
        expect(company).toEqual({company: {
          handle: "EARTH",
          name: "Planet Earth",
          num_employees: 13,
          description: "Is this a real company?",
          logo_url: null
        }});
      }
    );

    test("should throw an error with bad inputs", 
      async function () {
        const response = await request(app)
          .post("/companies")
          .send({
            num_employees: -1523,
          });
        const companies = response.body;

        expect(response.statusCode).toBe(400);
        expect(companies).toEqual({
          status: 400,
          message: [
                  "instance requires property \"handle\"",
                  "instance requires property \"name\"",
                  "instance.num_employees must have a minimum value of 0"
                  ]
        });
      }
    );
  });

  describe("GET /companies/:handle - gets a specific company", () => {
    beforeEach(async function () {
      await db.query(`DELETE FROM companies`);
      await db.query(`
        INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 49, 'A test company for tests', 'https://bit.ly/2LWkdq5');
      `);
    });

    test("should get a company",
      async function () {
        const response = await request(app)
          .get("/companies/TEST1");
        const company = response.body;

        expect(response.statusCode).toBe(200);
        expect(company).toEqual({company: {
          handle: "TEST1",
          name: "Test1 Co. Ltd",
          num_employees: 49,
          description: "A test company for tests",
          logo_url: "https://bit.ly/2LWkdq5"
        }});
      }
    );

    test("should throw an error if company was not found", 
      async function () {
        const response = await request(app)
          .get("/companies/LJKD");
        const company = response.body;

        expect(response.statusCode).toBe(404);
        expect(company).toEqual({
          status: 404,
          message: "Company not found"
        });
      }
    );
  });

  describe("PATCH /companies/:handle - updates an existing company", () => {
    beforeEach(async function () {
      await db.query(`DELETE FROM companies`);
      await db.query(`
        INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 49, 'A test company for tests', 'https://bit.ly/2LWkdq5');
      `);
    });

    test("should update a company",
      async function () {
        const response = await request(app)
          .patch("/companies/TEST1")
          .send({
            num_employees: 1000
          });
        const company = response.body;

        expect(response.statusCode).toBe(200);
        expect(company).toEqual({ company: {
          handle: "TEST1",
          name: "Test1 Co. Ltd",
          num_employees: 1000,
          description: "A test company for tests",
          logo_url: "https://bit.ly/2LWkdq5"
        }});
      }
    );

    test("should throw an error if company was not found", 
      async function () {
        const response = await request(app)
        .patch("/companies/LJKD")
        .send({
          num_employees: 1000
        });
        const company = response.body;

        expect(response.statusCode).toBe(404);
        expect(company).toEqual({
          status: 404,
          message: "Company not found"
        });
      }
    );

    test("should throw an error when given bad input", 
      async function () {
        const response = await request(app)
        .patch("/companies/LJKD")
        .send({
          num_employees: -3984
        });
        const company = response.body;

        expect(response.statusCode).toBe(400);
        expect(company).toEqual({
          status: 400,
          message: [ 
            'instance.num_employees must have a minimum value of 0'
          ]
        });
      }
    );
  });

  describe("DELETE /companies/:handle - deletes an existing company", () => {
    beforeEach(async function () {
      await db.query(`DELETE FROM companies`);
      await db.query(`
        INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 49, 'A test company for tests', 'https://bit.ly/2LWkdq5');
      `);
    });

    test("should delete a company",
      async function () {
        const response = await request(app)
          .delete("/companies/TEST1");
        const company = response.body;
        expect(response.statusCode).toBe(200);
        expect(company).toEqual({
          message: "Company deleted"
        });
      }
    );

    test("should throw an error if company was not found", 
      async function() {
        const response = await request(app)
          .delete("/companies/LJKD");
        const company = response.body;

        expect(response.statusCode).toBe(404);
        expect(company).toEqual({
          status: 404,
          message: "Company not found"
        });
      }
    );
  });

  afterAll(async function () {
    await db.end();
  });
});