const cleanItems = require('../../helpers/cleanItems');

describe("cleans object passed to make queries", function() {
  describe("cleanItems()", function (){
    const items = {
      itemOne: "one",
      itemTwo: "two",
      itemThree: "three"
    };

    test("should generate object with only keys based on needed keys",
      function () {
        const neededKeys = ["itemOne", "itemTwo"];
        let cleanedItems = cleanItems(items, neededKeys);
        expect(cleanedItems).toEqual({
          itemOne: "one",
          itemTwo: "two"
        });
      }
    )

    test("should generate an empty object when no keys match",
      function () {
        const neededKeys = ["itemFour", "itemFive"];
        let cleanedItems = cleanItems(items, neededKeys);
        expect(cleanedItems).toEqual({});
      }
    );

    test("should generate an object with all keys when all keys match",
      function () {
        const neededKeys = ["itemOne", "itemTwo", "itemThree"];
        let cleanedItems = cleanItems(items, neededKeys);
        expect(cleanedItems).toEqual({
          itemOne: "one",
          itemTwo: "two",
          itemThree: "three"
        });
      }
    );

    test("should generate an empty object when there are no needed keys",
    function () {
      const neededKeys = [];
      let cleanedItems = cleanItems(items, neededKeys);
      expect(cleanedItems).toEqual({});
    }
  );
  });
});