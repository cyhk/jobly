const db = require("../../db");
const app = require("../../app");
const request = require("supertest");

describe("Test Job Routes", () => {

  describe("GET /jobs/ - Gets all jobs matching query parameters (if any)", () => {
    beforeEach(async function () {
      await db.query(`DELETE FROM jobs`);
      await db.query(`DELETE FROM companies`);

      await db.query(`
        INSERT INTO companies (handle, name, employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 187, 'A test company for tests', 'https://bit.ly/2JFIhMB');
      `);

      await db.query(`
        INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('CEO', 100.01, 0.3, 'TEST1');
      `);

      await db.query(`
        INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('CFO', 10000, 0.4, 'TEST1');
      `);
    });

    test("should get all jobs when no filters are given",
      async function () {
        const response = await request(app)
          .get("/jobs");
        const jobs = response.body;

        expect(response.statusCode).toBe(200);
        expect(jobs).toEqual({
          jobs: [
            {
              title: "CEO",
              company_handle: "TEST1"
            },
            {
              title: "CFO",
              company_handle: "TEST1"
            }]
        });
      }
    );

    test("should get matching jobs when all filters are given",
      async function () {
        const response = await request(app)
          .get("/jobs")
          .query({ 
            search: 'CEO',
            min_salary: 100,
            min_equity: 0.1
          });
        const jobs = response.body;

        expect(response.statusCode).toBe(200);
        expect(jobs).toEqual({
          jobs: [
            {
              title: "CEO",
              company_handle: "TEST1"
            }]
        });
      }
    );

    test("filter jobs by search term for name if it exists",
      async function () {
        const response = await request(app)
          .get("/jobs")
          .query({ search: 'CEO'
         });
        const jobs = response.body;

        expect(response.statusCode).toBe(200);
        expect(jobs).toEqual({
          jobs: [
            {
              title: "CEO",
              company_handle: "TEST1"
            }
          ]
        });
      }
    );

    test("searching for name that does not exist should return nothing",
      async function () {
        const response = await request(app)
          .get("/jobs")
          .query({ search: 'asdlkfasd' });
        const jobs = response.body;

        expect(response.statusCode).toBe(200);
        expect(jobs).toEqual({ jobs: [] });
      }
    );

    test("get all jobs matching minimum salary",
      async function () {
        const response = await request(app)
          .get("/jobs")
          .query({ min_salary: 1000 });
        const jobs = response.body;

        expect(response.statusCode).toBe(200);
        expect(jobs).toEqual({
          jobs: [
            {
              title: "CFO",
              company_handle: "TEST1"
            }]
        });
      }
    );

    test("get no jobs with non-matching min_salary",
      async function () {
        const response = await request(app)
          .get("/jobs")
          .query({ min_salary: 99999 });
        const jobs = response.body;

        expect(response.statusCode).toBe(200);
        expect(jobs).toEqual({
          jobs: []
        });
      }
    );

    test("get all jobs matching minimum equity",
      async function () {
        const response = await request(app)
          .get("/jobs")
          .query({ min_equity: 0.35 });
        const jobs = response.body;

        expect(response.statusCode).toBe(200);
        expect(jobs).toEqual({ jobs: [{
          title: "CFO",
          company_handle: "TEST1"
        }]});
      }
    );

    test("get no jobs with non-matching min_equity",
      async function () {
        const response = await request(app)
          .get("/jobs")
          .query({ min_equity: 0.9 });
        const jobs = response.body;

        expect(response.statusCode).toBe(200);
        expect(jobs).toEqual({
          jobs: []
        });
      }
    );
  });

  describe("POST /jobs/ - creates a new job", () => {
    beforeEach(async function () {
      await db.query(`DELETE FROM jobs`);
      await db.query(`DELETE FROM companies`);

      await db.query(`
        INSERT INTO companies (handle, name, employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 187, 'A test company for tests', 'https://bit.ly/2JFIhMB');
      `);
      
      await db.query(`
        INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('CEO', 100.01, 0.3, 'TEST1')
        RETURNING id;
      `);
    });

    test("should create new job",
      async function () {
        const response = await request(app)
          .post("/jobs")
          .send({
            title: "CFO",
            salary: 10000,
            equity: 0.4,
            company_handle: "TEST1"
          });
        const job = response.body;

        expect(response.statusCode).toBe(200);
        expect(job).toEqual({job: {
          id: expect.any(Number),
          title: "CFO",
          salary: 10000,
          equity: 0.4,
          company_handle: "TEST1",
          date_posted: expect.any(String)
        }});
      }
    );

    test("should throw an error with bad inputs", 
      async function () {
        const response = await request(app)
          .post("/jobs")
          .send({
            salary: 10000,
            equity: -0.4
          });
        const jobs = response.body;

        expect(response.statusCode).toBe(400);
        expect(jobs).toEqual({
          status: 400,
          message: [
                  "instance requires property \"title\"",
                  "instance requires property \"company_handle\"",
                  "instance.equity must have a minimum value of 0"
                  ]
        });
      }
    );
  });

  describe("GET /jobs/:id - gets a specific company", () => {
    let id = null;
    beforeEach(async function () {
      await db.query(`DELETE FROM jobs`);
      await db.query(`DELETE FROM companies`);

      await db.query(`
        INSERT INTO companies (handle, name, employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 187, 'A test company for tests', 'https://bit.ly/2JFIhMB');
      `);

      let response = await db.query(`
        INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('CEO', 100.01, 0.3, 'TEST1')
        RETURNING id;
      `);

      id = response.rows[0].id;
    });

    test("should get a job",
      async function () {
        const response = await request(app)
          .get(`/jobs/${id}`);
        const job = response.body;

        expect(response.statusCode).toBe(200);
        expect(job).toEqual({job: {
          id: expect.any(Number),
          title: "CEO",
          salary: 100.01,
          equity: 0.3,
          company_handle: "TEST1",
          date_posted: expect.any(String)
        }});
      }
    );

    test("should throw an error if job was not found", 
      async function () {
        const response = await request(app)
          .get("/jobs/999999");
        const job = response.body;

        expect(response.statusCode).toBe(404);
        expect(job).toEqual({
          status: 404,
          message: "Job not found"
        });
      }
    );
  });

  describe("PATCH /jobs/:id - updates an existing job", () => {
    let id = null;
    beforeEach(async function () {
      await db.query(`DELETE FROM jobs`);
      await db.query(`DELETE FROM companies`);

      await db.query(`
        INSERT INTO companies (handle, name, employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 187, 'A test company for tests', 'https://bit.ly/2JFIhMB');
      `);

      let response = await db.query(`
        INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('CEO', 100.01, 0.3, 'TEST1')
        RETURNING id;
      `);

      id = response.rows[0].id;
    });

    test("should update a job",
      async function () {
        const response = await request(app)
          .patch(`/jobs/${id}`)
          .send({
            salary: 1000.01
          });
        const job = response.body;
        console.log(job);
        expect(response.statusCode).toBe(200);
        expect(job).toEqual({ job: {
          id: expect.any(Number),
          title: "CEO",
          salary: 1000.01,
          equity: 0.3,
          company_handle: "TEST1",
          date_posted: expect.any(String)
        }});
      }
    );

    test("should throw an error if job was not found", 
      async function () {
        const response = await request(app)
        .patch("/jobs/999999")
        .send({
          salary: 1000.01
        });
        const job = response.body;

        expect(response.statusCode).toBe(404);
        expect(job).toEqual({
          status: 404,
          message: "Job not found"
        });
      }
    );

    test("should throw an error when given bad input", 
      async function () {
        const response = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          salary: -3984
        });
        const job = response.body;

        expect(response.statusCode).toBe(400);
        expect(job).toEqual({
          status: 400,
          message: [ 
            'instance.salary must have a minimum value of 0'
          ]
        });
      }
    );
  });

  describe("DELETE /jobs/:id - deletes an existing job", () => {
    let id = null;
    beforeEach(async function () {
      await db.query(`DELETE FROM jobs`);
      await db.query(`DELETE FROM companies`);

      await db.query(`
        INSERT INTO companies (handle, name, employees, description, logo_url)
        VALUES ('TEST1', 'Test1 Co. Ltd', 187, 'A test company for tests', 'https://bit.ly/2JFIhMB');
      `);

      let response = await db.query(`
        INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('CEO', 100.01, 0.3, 'TEST1')
        RETURNING id;
      `);

      id = response.rows[0].id;
    });

    test("should delete a job",
      async function () {
        const response = await request(app)
          .delete(`/jobs/${id}`);
        const job = response.body;
        expect(response.statusCode).toBe(200);
        expect(job).toEqual({
          message: "Job deleted"
        });
      }
    );

    test("should throw an error if job was not found", 
      async function() {
        const response = await request(app)
          .delete("/jobs/999999");
        const job = response.body;

        expect(response.statusCode).toBe(404);
        expect(job).toEqual({
          status: 404,
          message: "Job not found"
        });
      }
    );
  });

  afterAll(async function () {
    await db.end();
  });
});