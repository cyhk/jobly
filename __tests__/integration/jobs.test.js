const db = require("../../db");
const app = require("../../app");
const request = require("supertest");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config");

describe("Test Job Routes", () => {
  let id = null;
  beforeEach(async function () {
    await db.query(`DELETE FROM users`);
    await db.query(`DELETE FROM jobs`);
    await db.query(`DELETE FROM companies`);

    const hashedPassword = await bcrypt.hash(
      "unhashedPassword1",
      BCRYPT_WORK_FACTOR
    );

    const hashedPassword2 = await bcrypt.hash(
      "unhashedPassword2",
      BCRYPT_WORK_FACTOR
    );

    await db.query(
      `
      INSERT INTO users (username, password, first_name, last_name, email, photo_url)
      VALUES ('testUser', $1, 'Test', 'User', 'testUser@test.com', 'https://bit.ly/fakeURL');
    `,
      [hashedPassword]
    );

    await db.query(
      `
      INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin)
      VALUES ('adminUser', $1, 'Admin', 'User', 'adminUser@test.com', 'https://bit.ly/fakeURL', true);
    `,
      [hashedPassword2]
    );

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

    await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES ('CFO', 10000, 0.4, 'TEST1');
    `);
  });

  describe("GET /jobs/ - Gets all jobs matching query parameters (if any)", () => {
    test("should get all jobs when no filters are given", async function () {
      const response = await request(app).get("/jobs");
      const jobs = response.body;

      expect(response.statusCode).toBe(200);
      expect(jobs).toEqual({
        jobs: [
          {
            title: "CEO",
            company_handle: "TEST1",
          },
          {
            title: "CFO",
            company_handle: "TEST1",
          },
        ],
      });
    });

    test("should get matching jobs when all filters are given", async function () {
      const response = await request(app).get("/jobs").query({
        search: "CEO",
        min_salary: 100,
        min_equity: 0.1,
      });
      const jobs = response.body;

      expect(response.statusCode).toBe(200);
      expect(jobs).toEqual({
        jobs: [
          {
            title: "CEO",
            company_handle: "TEST1",
          },
        ],
      });
    });

    test("filter jobs by search term for name if it exists", async function () {
      const response = await request(app).get("/jobs").query({
        search: "CEO",
      });
      const jobs = response.body;

      expect(response.statusCode).toBe(200);
      expect(jobs).toEqual({
        jobs: [
          {
            title: "CEO",
            company_handle: "TEST1",
          },
        ],
      });
    });

    test("searching for name that does not exist should return nothing", async function () {
      const response = await request(app)
        .get("/jobs")
        .query({ search: "asdlkfasd" });
      const jobs = response.body;

      expect(response.statusCode).toBe(200);
      expect(jobs).toEqual({ jobs: [] });
    });

    test("get all jobs matching minimum salary", async function () {
      const response = await request(app)
        .get("/jobs")
        .query({ min_salary: 1000 });
      const jobs = response.body;

      expect(response.statusCode).toBe(200);
      expect(jobs).toEqual({
        jobs: [
          {
            title: "CFO",
            company_handle: "TEST1",
          },
        ],
      });
    });

    test("get no jobs with non-matching min_salary", async function () {
      const response = await request(app)
        .get("/jobs")
        .query({ min_salary: 99999 });
      const jobs = response.body;

      expect(response.statusCode).toBe(200);
      expect(jobs).toEqual({
        jobs: [],
      });
    });

    test("get all jobs matching minimum equity", async function () {
      const response = await request(app)
        .get("/jobs")
        .query({ min_equity: 0.35 });
      const jobs = response.body;

      expect(response.statusCode).toBe(200);
      expect(jobs).toEqual({
        jobs: [
          {
            title: "CFO",
            company_handle: "TEST1",
          },
        ],
      });
    });

    test("get no jobs with non-matching min_equity", async function () {
      const response = await request(app)
        .get("/jobs")
        .query({ min_equity: 0.9 });
      const jobs = response.body;

      expect(response.statusCode).toBe(200);
      expect(jobs).toEqual({
        jobs: [],
      });
    });
  });

  describe("POST /jobs/ - creates a new job", () => {
    test("should create new job if user is admin", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "unhashedPassword2",
      });
      const { token } = loginResponse.body;

      const response = await request(app).post("/jobs").send({
        title: "CFO",
        salary: 10000,
        equity: 0.4,
        company_handle: "TEST1",
        _token: token,
      });
      const job = response.body;

      expect(response.statusCode).toBe(200);
      expect(job).toEqual({
        job: {
          id: expect.any(Number),
          title: "CFO",
          salary: 10000,
          equity: 0.4,
          company_handle: "TEST1",
          date_posted: expect.any(String),
        },
      });
    });

    test("should not create new job if user is not admin", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "testUser",
        password: "unhashedpassword1",
      });
      const { token } = loginResponse.body;

      const response = await request(app).post("/jobs").send({
        title: "CFO",
        salary: 10000,
        equity: 0.4,
        company_handle: "TEST1",
        _token: token,
      });
      const job = response.body;

      expect(response.statusCode).toBe(401);
      expect(job).toEqual({
        message: "Unauthorized",
        status: 401,
      });
    });

    test("should not create new job if user is not logged in", async function () {
      const response = await request(app).post("/jobs").send({
        title: "CFO",
        salary: 10000,
        equity: 0.4,
        company_handle: "TEST1",
      });
      const job = response.body;

      expect(response.statusCode).toBe(401);
      expect(job).toEqual({
        message: "Unauthorized",
        status: 401,
      });
    });

    test("should throw an error with bad inputs", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "unhashedPassword2",
      });
      const { token } = loginResponse.body;

      const response = await request(app).post("/jobs").send({
        salary: 10000,
        equity: -0.4,
        _token: token,
      });
      const jobs = response.body;

      expect(response.statusCode).toBe(400);
      expect(jobs).toEqual({
        status: 400,
        message: [
          'instance requires property "title"',
          'instance requires property "company_handle"',
          "instance.equity must have a minimum value of 0",
        ],
      });
    });
  });

  describe("GET /jobs/:id - gets a specific job", () => {
    test("should get a job", async function () {
      const response = await request(app).get(`/jobs/${id}`);
      const job = response.body;

      expect(response.statusCode).toBe(200);
      expect(job).toEqual({
        job: {
          id: expect.any(Number),
          title: "CEO",
          salary: 100.01,
          equity: 0.3,
          company_handle: "TEST1",
          date_posted: expect.any(String),
        },
      });
    });

    test("should throw an error if job was not found", async function () {
      const response = await request(app).get("/jobs/999999");
      const job = response.body;

      expect(response.statusCode).toBe(404);
      expect(job).toEqual({
        status: 404,
        message: "Job not found",
      });
    });
  });

  describe("PATCH /jobs/:id - updates an existing job", () => {
    test("should update a job if user is admin", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "unhashedPassword2",
      });
      const { token } = loginResponse.body;

      const response = await request(app).patch(`/jobs/${id}`).send({
        salary: 1000.01,
        _token: token,
      });
      const job = response.body;

      expect(response.statusCode).toBe(200);
      expect(job).toEqual({
        job: {
          id: expect.any(Number),
          title: "CEO",
          salary: 1000.01,
          equity: 0.3,
          company_handle: "TEST1",
          date_posted: expect.any(String),
        },
      });
    });

    test("should not update a job if user is not admin", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "testUser",
        password: "unhashedpassword1",
      });
      const { token } = loginResponse.body;

      const response = await request(app).patch(`/jobs/${id}`).send({
        salary: 1000.01,
        _token: token,
      });
      const job = response.body;

      expect(response.statusCode).toBe(401);
      expect(job).toEqual({
        message: "Unauthorized",
        status: 401,
      });
    });

    test("should throw an error if job was not found", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "unhashedPassword2",
      });
      const { token } = loginResponse.body;

      const response = await request(app).patch("/jobs/999999").send({
        salary: 1000.01,
        _token: token,
      });
      const job = response.body;

      expect(response.statusCode).toBe(404);
      expect(job).toEqual({
        status: 404,
        message: "Job not found",
      });
    });

    test("should throw an error when given bad input", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "unhashedPassword2",
      });
      const { token } = loginResponse.body;

      const response = await request(app).patch(`/jobs/${id}`).send({
        salary: -3984,
        _token: token,
      });
      const job = response.body;

      expect(response.statusCode).toBe(400);
      expect(job).toEqual({
        status: 400,
        message: ["instance.salary must have a minimum value of 0"],
      });
    });
  });

  describe("DELETE /jobs/:id - deletes an existing job", () => {
    test("should delete a job if user is admin", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "unhashedPassword2",
      });
      const { token } = loginResponse.body;

      const response = await request(app).delete(`/jobs/${id}`).send({
        _token: token,
      });
      const job = response.body;
      expect(response.statusCode).toBe(200);
      expect(job).toEqual({
        message: "Job deleted",
      });
    });

    test("should not delete a job if user is not admin", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "testUser",
        password: "unhashedpassword1",
      });
      const { token } = loginResponse.body;

      const response = await request(app).delete(`/jobs/${id}`).send({
        _token: token,
      });
      const job = response.body;
      expect(response.statusCode).toBe(401);
      expect(job).toEqual({
        message: "Unauthorized",
        status: 401,
      });
    });

    test("should throw an error if job was not found", async function () {
      const loginResponse = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "unhashedPassword2",
      });
      const { token } = loginResponse.body;

      const response = await request(app).delete("/jobs/999999").send({
        _token: token,
      });
      const job = response.body;

      expect(response.statusCode).toBe(404);
      expect(job).toEqual({
        status: 404,
        message: "Job not found",
      });
    });
  });

  afterAll(async function () {
    await db.end();
  });
});
