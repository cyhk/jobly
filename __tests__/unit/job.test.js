const db = require("../../db");
const Job = require("../../models/job");

describe("Test Job Class", () => {
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

  describe("create()", () => {
    test("should add job to database", async function () {
      const newJob = {
        title: "Planet in solar system",
        salary: 0.01,
        equity: 0.99,
        company_handle: "TEST1",
      };
      const job = await Job.create(newJob);

      expect(job).toEqual({
        id: expect.any(Number),
        title: "Planet in solar system",
        salary: 0.01,
        equity: 0.99,
        company_handle: "TEST1",
        date_posted: expect.any(Date),
      });
    });
  });

  describe("all()", () => {
    test("get all jobs", async function () {
      const jobs = await Job.all({});
      expect(jobs).toEqual([
        {
          title: "CEO",
          company_handle: "TEST1",
        },
      ]);
    });

    test("get all jobs matching all search filters", async function () {
      const job = await Job.all({
        search: "CEO",
        min_salary: 100,
        min_equity: 0.1,
      });
      expect(job).toEqual([
        {
          title: "CEO",
          company_handle: "TEST1",
        },
      ]);
    });

    test("get all jobs matching search filter", async function () {
      const jobs = await Job.all({ search: "CEO" });
      expect(jobs).toEqual([
        {
          title: "CEO",
          company_handle: "TEST1",
        },
      ]);
    });

    test("get no jobs when search filter does not match", async function () {
      const jobs = await Job.all({ search: "LKJS" });
      expect(jobs).toEqual([]);
    });

    test("get all jobs matching min_salary filter", async function () {
      const jobs = await Job.all({ min_salary: 2 });
      expect(jobs).toEqual([
        {
          title: "CEO",
          company_handle: "TEST1",
        },
      ]);
    });

    test("get no jobs when min_salary filter does not match", async function () {
      const jobs = await Job.all({ min_salary: 999999 });
      expect(jobs).toEqual([]);
    });

    test("get all jobs matching min_equity filter", async function () {
      const jobs = await Job.all({ min_equity: 0.2 });
      expect(jobs).toEqual([
        {
          title: "CEO",
          company_handle: "TEST1",
        },
      ]);
    });

    test("get all jobs matching min_equity filter", async function () {
      const jobs = await Job.all({ min_equity: 0.99 });
      expect(jobs).toEqual([]);
    });
  });

  describe("get()", () => {
    test("should get a job", async function () {
      const job = await Job.get(id);

      expect(job).toEqual({
        id: expect.any(Number),
        title: "CEO",
        salary: 100.01,
        equity: 0.3,
        company_handle: "TEST1",
        date_posted: expect.any(Date),
      });
    });

    test("should throw an error if job was not found", async () => {
      await expect(Job.get(999999)).rejects.toThrow("Job not found");
    });
  });

  describe("update()", () => {
    test("should update a job", async function () {
      const valsToUpdate = {
        salary: 100000,
      };
      const job = await Job.update(id, valsToUpdate);

      expect(job).toEqual({
        id: expect.any(Number),
        title: "CEO",
        salary: 100000,
        equity: 0.3,
        company_handle: "TEST1",
        date_posted: expect.any(Date),
      });
    });

    test("should throw an error if job was not found", async () => {
      const valsToUpdate = {
        salary: 100000,
      };

      await expect(Job.update(999999, valsToUpdate)).rejects.toThrow(
        "Job not found"
      );
    });
  });

  describe("delete()", () => {
    test("should delete a job", async function () {
      const job = await Job.delete(id);

      expect(job).toEqual("Job deleted");
    });

    test("should throw an error if job was not found", async () => {
      await expect(Job.delete(999999)).rejects.toThrow("Job not found");
    });
  });

  afterAll(async function () {
    await db.end();
  });
});
