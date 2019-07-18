const db = require("../../db");
const sqlForPartialUpdate = require("../../helpers/partialUpdate");

process.env.NODE_ENV = "test";

describe("partialUpdate()", () => {

  beforeEach(async function(){
    const result = await db.query(`
      INSERT INTO companies (handle, name, num_employees, description, logo_url)
      VALUES ("TEST", "Test Co. Ltd", 1, NULL, NULL);
    `);
  });
  
  it("should generate a proper partial update query with just 1 field",
    function () {
      const items = {
        num_employees: 50000,
      };

      let queryAndVals = sqlForPartialUpdate("companies", items, "handle", "TEST");

      expect(queryAndVals).toEqual({
          query: 'UPDATE companies SET num_employes=$1 WHERE handle=$2 RETURNING *',
          values: [50000, "TEST"]
        });
    });

  afterAll(async function(){
    await db.end();
  });
});
