const { sqlForPartialUpdate, 
    searchQuery, 
    createValues 
  } = require('../../helpers/queryHelpers');

describe("Query helper functions", function() {
  describe("searchQuery()", function (){
    test("should generate a proper query given one value",
      function () {
        const filters = {
          itemOne_colOne: "one"
        };
        const selectCols = ["colOne", "numbers"];
        let queryAndVals = searchQuery(filters, selectCols, "test_table");
        expect(queryAndVals).toEqual({
        query: "SELECT colOne, numbers FROM test_table WHERE " +
               "colOne ILIKE $1",
        values: ["%one%"]
        });
      }
    );

    test("should generate a proper query given multiple values",
      function () {
        const filters = {
          itemOne_colOne: "one",
          min_numbers: 100,
          max_numbers: 1000
        };
        const selectCols = ["colOne", "numbers"];
        let queryAndVals = searchQuery(filters, selectCols, "test_table");
        expect(queryAndVals).toEqual({
        query: "SELECT colOne, numbers FROM test_table WHERE " +
               "colOne ILIKE $1 AND numbers >= $2 AND numbers <= $3",
        values: ["%one%", 100, 1000]
        });
      }
    );

    test("should generate a proper query given no values",
    function () {
      const filters = {};
      const selectCols = ["colOne", "numbers"];
      let queryAndVals = searchQuery(filters, selectCols, "test_table");
      expect(queryAndVals).toEqual({
      query: "SELECT colOne, numbers FROM test_table",
      values: []
      });
    }
  );
  });

  describe("createValues()", function (){
    test("should generate a proper query given one value",
      function () {
        const details = {
          colOne: "one"
        };

        const allCols = ["colOne", "colTwo", "colThree"];

        let queryAndVals = createValues(details, "test_table", allCols);
        expect(queryAndVals).toEqual({
        query: "INSERT INTO test_table (colOne) " +
                "VALUES ($1) RETURNING colOne, colTwo, colThree",
        values: ["one"]
        });
      }
    );

    test("should generate a proper query given multiple values",
      function () {
        const details = {
          colOne: "one",
          colTwo: "two",
          colThree: "three"
        };

        const allCols = ["colOne"];

        let queryAndVals = createValues(details, "test_table", allCols);
        expect(queryAndVals).toEqual({
        query: "INSERT INTO test_table (colOne, colTwo, colThree) " +
                "VALUES ($1, $2, $3) RETURNING colOne",
        values: ["one", "two", "three"]
        });
      }
    );

    test("should generate a bad query given no values",
      function () {
        const details = {};

        const allCols = [];

        let queryAndVals = createValues(details, "test_table", allCols);
        expect(queryAndVals).toEqual({
        query: "INSERT INTO test_table () " +
                "VALUES () RETURNING ",
        values: []
        });
      }
    );
  });

  describe("partialUpdate()", function (){
    test("should generate a proper partial update query with just 1 field",
      function () {
        const items = {
          num_employees: 50000,
        };

      let queryAndVals = sqlForPartialUpdate("companies", items, "handle", "TEST");

      expect(queryAndVals).toEqual({
        query: 'UPDATE companies SET num_employees=$1 WHERE handle=$2 RETURNING *',
        values: [50000, 'TEST']
      });
    });

    test("should generate a proper full update with all fields",
      function () {
        const items = {
        handle: "ABC",
        name: "Alphabet",
        num_employees: 244,
        description: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        logo_url: "https://www.google.com"
        }

        let queryAndVals = sqlForPartialUpdate("companies", items, "handle", "TEST");
        expect(queryAndVals).toEqual({
        query: 
        "UPDATE companies SET handle=$1, name=$2, " +
        "num_employees=$3, description=$4, logo_url=$5 WHERE handle=$6 RETURNING *",
        values: ['ABC', 'Alphabet', 244,
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'https://www.google.com', 'TEST']
        });
      }
    );

    test("should generate a bad query with no fields",
      function () {
        const items = {};

        let queryAndVals = sqlForPartialUpdate("companies", items, "handle", "TEST");

        expect(queryAndVals).toEqual({
            query: 'UPDATE companies SET  WHERE handle=$1 RETURNING *',
            values: ['TEST']
        });
      }
    );
  });
});