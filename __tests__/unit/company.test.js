const db = require("../../db");
const Company = require("../../models/company");

describe("Test Company Class", () => {
  beforeEach(async function () {
    await db.query(`DELETE FROM jobs`);
    await db.query(`DELETE FROM companies`);

    await db.query(`
      INSERT INTO companies (handle, name, employees, description, logo_url)
      VALUES ('TEST1', 'Test1 Co. Ltd', 49, 'A test company for tests', 'https://bit.ly/2LWkdq5');
    `);

    await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES ('CEO', 100.01, 0.3, 'TEST1')
      RETURNING id;
    `);
  });

  describe("create()", () => {
    test("should add company to database",
      async function () {
        const newCompany = {
          handle: "EARTH",
          name: "Planet Earth",
          employees: 13,
          description: "Is this a real company?"
        }

        const company = await Company.create(newCompany);

        expect(company).toEqual({
          handle: "EARTH",
          name: "Planet Earth",
          employees: 13,
          description: "Is this a real company?",
          logo_url: ""
        });
      }
    );
  });

  describe("all()", () => {
    test("get all companies",
      async function () {
        const companies = await Company.all({});
        expect(companies).toEqual([{
          handle: "TEST1",
          name: "Test1 Co. Ltd"
        }]);
      }
    );

    test("get all companies matching all search filters",
      async function () {
        const companies = await Company.all({
          search: "test",
          min_employees: 1,
          max_employees: 99
        });
        expect(companies).toEqual([{
          handle: "TEST1",
          name: "Test1 Co. Ltd"
        }]);
      }
    );

    test("get all companies matching search filter",
      async function () {
        const companies = await Company.all({ search: "test" });
        expect(companies).toEqual([{
          handle: "TEST1",
          name: "Test1 Co. Ltd"
        }]);
      }
    );

    test("get no companies when search filter does not match",
      async function () {
        const companies = await Company.all({ search: "LKJS" });
        expect(companies).toEqual([]);
      }
    );

    test("get all companies matching min_employees filter",
      async function () {
        const companies = await Company.all({ min_employees: 2 });
        expect(companies).toEqual([{
          handle: "TEST1",
          name: "Test1 Co. Ltd"
        }]);
      }
    );

    test("get no companies when min_employees filter does not match",
      async function () {
        const companies = await Company.all({ min_employees: 88 });
        expect(companies).toEqual([]);
      }
    );

    test("get all companies matching max_employees filter",
      async function () {
        const companies = await Company.all({ max_employees: 100 });
        expect(companies).toEqual([{
          handle: "TEST1",
          name: "Test1 Co. Ltd"
        }]);
      }
    );

    test("get all companies matching max_employees filter",
      async function () {
        const companies = await Company.all({ max_employees: 3 });
        expect(companies).toEqual([]);
      }
    );

    test("throw error when min employees is bigger than max employees",
      async () => {
        await expect(Company.all({
          max_employees: 3,
          min_employees: 100
        }))
          .rejects
          .toThrow("Min employees cannot be larger than max employees");
      }
    );
  });

  describe("get()", () => {
    test("should get a company",
      async function () {
        const company = await Company.get('TEST1');

        expect(company).toEqual({
          handle: "TEST1",
          name: "Test1 Co. Ltd",
          employees: 49,
          description: "A test company for tests",
          logo_url: "https://bit.ly/2LWkdq5",
          jobs: [{
            id: expect.any(Number),
            title: "CEO",
            date_posted: expect.any(Date)
          }]
        });
      }
    );

    test("should throw an error if company was not found",
      async () => {
        await expect(Company.get("KLJF"))
          .rejects
          .toThrow("Company not found");
      }
    );
  });

  describe("update()", () => {
    test("should update a company",
      async function () {
        const valsToUpdate = {
          name: "LotsOfTests Co. Ltd",
          employees: 1000,
        };
        const company = await Company.update('TEST1', valsToUpdate);

        expect(company).toEqual({
          handle: "TEST1",
          name: "LotsOfTests Co. Ltd",
          employees: 1000,
          description: "A test company for tests",
          logo_url: "https://bit.ly/2LWkdq5",
        })
      }
    );

    test("should throw an error if company was not found",
      async () => {
        const valsToUpdate = {
          name: "LotsOfTests Co. Ltd",
          employees: 1000,
        }

        await expect(Company.update("KLJF", valsToUpdate))
          .rejects
          .toThrow("Company not found");
      }
    );
  });

  describe("delete()", () => {
    test("should delete a company",
      async function () {
        const company = await Company.delete('TEST1');

        expect(company).toEqual("Company deleted");
      }
    );

    test("should throw an error if company was not found",
      async () => {
        await expect(Company.delete("KLJF"))
          .rejects
          .toThrow("Company not found");
      }
    );
  });

  afterAll(async function () {
    await db.end();
  });
});