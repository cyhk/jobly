const db = require("../../db");
const app = require("../../app");
const request = require("supertest");
const { TOKEN, ADMIN_TOKEN } = require("../../config");

describe("Test Company Routes", () => {
  beforeEach(async function () {
    await db.query(`DELETE FROM companies`);
    await db.query(`
      INSERT INTO companies (handle, name, employees, description, logo_url)
      VALUES ('TEST1', 'Test1 Co. Ltd', 49, 'A test company for tests', 'https://bit.ly/2LWkdq5');
    `);

    await db.query(`
      INSERT INTO companies (handle, name, employees, description, logo_url)
      VALUES ('TEST2', 'Test2 Co. Ltd', 187, 'A second test company for tests', 'https://bit.ly/2JFIhMB');
    `);

    await db.query(`
      INSERT INTO companies (handle, name, employees, description, logo_url)
      VALUES ('TEST3', 'Test3 Co. Ltd', 15, 'A third test company for tests', 'https://bit.ly/2NVIkHV');
    `);

    await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES ('CEO', 100.01, 0.3, 'TEST1')
      RETURNING id;
    `);
  });

  describe("GET /companies/ - Gets all companies matching query parameters (if any)", () => {
    test("should get all companies when no filters are given",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({
            _token: TOKEN
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

    test("should not get any companies if unauthorized",
      async function () {
        const response = await request(app)
          .get("/companies");
        const companies = response.body;

        expect(response.statusCode).toBe(401);
        expect(companies).toEqual({
          status: 401,
          message: "Unauthorized"
        });
      }
    );

    test("should get matching companies when all filters are given",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ 
            search: 'Test',
            min_employees: 1,
            max_employees: 100,
            _token: TOKEN
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
          .query({ 
            search: 'Test1',
            _token: TOKEN
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
          .query({ 
            search: 'asdlkfasd',
            _token: TOKEN
          });
        const companies = response.body;

        expect(response.statusCode).toBe(200);
        expect(companies).toEqual({ companies: [] });
      }
    );

    test("get all companies matching minimum employees",
      async function () {
        const response = await request(app)
          .get("/companies")
          .query({ 
            min_employees: 100,
            _token: TOKEN
          });
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
          .query({ 
            min_employees: 10000,
            _token: TOKEN
          });
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
          .query({
            max_employees: 50,
            _token: TOKEN
          });
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
          .query({
            max_employees: 1,
            _token: TOKEN
          });
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
            min_employees: 10,
            _token: TOKEN
          });
        const companies = response.body;

        expect(response.statusCode).toBe(400);
        expect(companies).toEqual({
          status: 400,
          message: "Min employees cannot be larger than max employees"
        });
      }
    );
  });

  describe("POST /companies/ - creates new company", () => {
    test("should create new company if user is admin",
      async function () {
        const response = await request(app)
          .post("/companies")
          .send({
            handle: "EARTH",
            name: "Planet Earth",
            employees: 13,
            description: "Is this a real company?",
            _token: ADMIN_TOKEN
          });
        const company = response.body;

        expect(response.statusCode).toBe(200);
        expect(company).toEqual({company: {
          handle: "EARTH",
          name: "Planet Earth",
          employees: 13,
          description: "Is this a real company?",
          logo_url: ""
        }});
      }
    );

    test("should not create new company if user is not admin",
      async function () {
        const response = await request(app)
          .post("/companies")
          .send({
            handle: "EARTH",
            name: "Planet Earth",
            employees: 13,
            description: "Is this a real company?",
            _token: TOKEN
          });
        const company = response.body;

        expect(response.statusCode).toBe(401);
        expect(company).toEqual({
          message: "Unauthorized",
          status: 401
        });
      }
    );

    test("should throw an error with bad inputs", 
      async function () {
        const response = await request(app)
          .post("/companies")
          .send({
            employees: -1523,
            logo_url: "hi...",
            _token: ADMIN_TOKEN
          });
        const companies = response.body;

        expect(response.statusCode).toBe(400);
        expect(companies).toEqual({
          status: 400,
          message: [
                  "instance requires property \"handle\"",
                  "instance requires property \"name\"",
                  "instance.employees must have a minimum value of 0",
                  "instance.logo_url does not conform to the \"uri\" format"
                  ]
        });
      }
    );
  });

  describe("GET /companies/:handle - gets a specific company", () => {
    test("should get a company if authorized",
      async function () {
        const response = await request(app)
          .get("/companies/TEST1")
          .query({
            _token: TOKEN
          });
        const company = response.body;

        expect(response.statusCode).toBe(200);
        expect(company).toEqual({company: {
          handle: "TEST1",
          name: "Test1 Co. Ltd",
          employees: 49,
          description: "A test company for tests",
          logo_url: "https://bit.ly/2LWkdq5",
          jobs: [{
            id: expect.any(Number),
            title: "CEO",
            date_posted: expect.any(String)
          }]
        }});
      }
    );

    test("should not get a company if unauthorized",
      async function () {
        const response = await request(app)
          .get("/companies/TEST1");
        const company = response.body;

        expect(response.statusCode).toBe(401);
        expect(company).toEqual({
          message: "Unauthorized",
          status: 401
        });
      }
    );

    test("should throw an error if company was not found", 
      async function () {
        const response = await request(app)
          .get("/companies/LJKD")
          .query({
            _token: TOKEN
          });
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
    test("should update a company if user is admin",
      async function () {
        const response = await request(app)
          .patch("/companies/TEST1")
          .send({
            employees: 1000,
            _token: ADMIN_TOKEN
          });
        const company = response.body;

        expect(response.statusCode).toBe(200);
        expect(company).toEqual({ company: {
          handle: "TEST1",
          name: "Test1 Co. Ltd",
          employees: 1000,
          description: "A test company for tests",
          logo_url: "https://bit.ly/2LWkdq5"
        }});
      }
    );

    test("should not update a company if user is not admin",
      async function () {
        const response = await request(app)
          .patch("/companies/TEST1")
          .send({
            employees: 1000,
            token: TOKEN
          });
        const company = response.body;

        expect(response.statusCode).toBe(401);
        expect(company).toEqual({
          message: "Unauthorized",
          status: 401
        });
      }
    );

    test("should throw an error if company was not found", 
      async function () {
        const response = await request(app)
        .patch("/companies/LJKD")
        .send({
          employees: 1000,
          _token: ADMIN_TOKEN
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
          employees: -3984,
          logo_url: "hello...",
          _token: ADMIN_TOKEN
        });
        const company = response.body;

        expect(response.statusCode).toBe(400);
        expect(company).toEqual({
          status: 400,
          message: [ 
            "instance.employees must have a minimum value of 0",
            "instance.logo_url does not conform to the \"uri\" format"
          ]
        });
      }
    );
  });

  describe("DELETE /companies/:handle - deletes an existing company", () => {
    test("should delete a company if admin",
      async function () {
        const response = await request(app)
          .delete("/companies/TEST1")
          .send({
            _token: ADMIN_TOKEN
          });
        const company = response.body;
        expect(response.statusCode).toBe(200);
        expect(company).toEqual({
          message: "Company deleted"
        });
      }
    );

    test("should not delete a company if user is not admin",
      async function () {
        const response = await request(app)
          .delete("/companies/TEST1")
          .send({
            _token: TOKEN
          });
        const company = response.body;
        expect(response.statusCode).toBe(401);
        expect(company).toEqual({
          message: "Unauthorized",
          status: 401
        });
      }
    );

    test("should throw an error if company was not found", 
      async function() {
        const response = await request(app)
          .delete("/companies/LJKD")
          .send({
            _token: ADMIN_TOKEN
          });
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