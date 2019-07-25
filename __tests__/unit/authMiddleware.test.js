const { TOKEN } = require("../../config");
const { 
        authenticateJWT, 
        ensureLoggedIn, 
        isAdmin 
      } = require("../../helpers/authMiddleware");

describe("Auth unit tests", () => {
  describe("authenticateJWT()", () => {
    test("should set req.user with payload if token can be verified",
      async function() {
        const next = jest.fn();
        const req = {
          body: {
              _token: TOKEN
          }
        };

        authenticateJWT(req, {}, next);
        expect(req.user).toBeTruthy(); //need to change!
        expect(next).toBeCalled();
      }
    );

    test("should not throw an error if token cannot be verified",
      async function() {
        const next = jest.fn(err => err);
        const req = {
          body: {
              _token: "1234"
          }
        };
        
        const returns = authenticateJWT(req, {}, next);

        expect(next).toBeCalled();
        expect(returns).toBe(undefined);
      }
    );
  });

  describe("ensureLoggedIn()", () => {
    test("should throw an error if user is not logged in", 
      async function() {
        const next = jest.fn(err => err);
        const req = {};

        const error = ensureLoggedIn(req, {}, next);

        expect(error.message).toBe("Unauthorized");
        expect(error.status).toBe(401);
      }
    );

    test("should not throw an error if user is logged in", 
      async function() {
        const next = jest.fn(err => err);
        const req = {
          user: "Hi!"
        };

        const error = ensureLoggedIn(req, {}, next);

        expect(error).toBe(undefined);
      }
    );
  });

  describe("isAdmin()", () => {
    test("should throw an error if user is not an admin", 
    async function() {
      const next = jest.fn(err => err);
      const req = {
        user: {
          is_admin: false
        }
      };

      const error = isAdmin(req, {}, next);

      expect(error.message).toBe("Unauthorized");
      expect(error.status).toBe(401);
    }
  );

    test("should not throw an error if user is not an admin", 
      async function() {
        const next = jest.fn(err => err);
        const req = {
          user: {
            is_admin: true
          }
        };

      const error = isAdmin(req, {}, next);

      expect(error).toBe(undefined);
      }
    );
  });
});