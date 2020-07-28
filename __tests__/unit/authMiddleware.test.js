const { SECRET_KEY } = require("../../config");
const {
  authenticateJWT,
  ensureLoggedIn,
  isAdmin,
} = require("../../helpers/authMiddleware");
const jwt = require("jsonwebtoken");

describe("Auth unit tests", () => {
  describe("authenticateJWT()", () => {
    test("should set req.user with payload if token can be verified", async function () {
      const next = jest.fn();

      let payload = { username: "testUser", is_admin: false };
      let token = jwt.sign(payload, SECRET_KEY);

      const req = {
        body: {
          _token: token,
        },
      };

      authenticateJWT(req, {}, next);
      expect(req.user).toBeTruthy();
      expect(next).toBeCalled();
    });

    test("should not throw an error if token cannot be verified", async function () {
      const next = jest.fn((err) => err);
      const req = {
        body: {
          _token: "1234",
        },
      };

      const returns = authenticateJWT(req, {}, next);

      expect(next).toBeCalled();
      expect(returns).toBe(undefined);
    });
  });

  describe("ensureLoggedIn()", () => {
    test("should throw an error if user is not logged in", async function () {
      const next = jest.fn((err) => err);
      const req = {};

      const error = ensureLoggedIn(req, {}, next);

      expect(error.message).toBe("Unauthorized");
      expect(error.status).toBe(401);
    });

    test("should not throw an error if user is logged in", async function () {
      const next = jest.fn((err) => err);
      const req = {
        user: "Hi!",
      };

      const error = ensureLoggedIn(req, {}, next);

      expect(error).toBe(undefined);
    });
  });

  describe("isAdmin()", () => {
    test("should throw an error if user is not an admin", async function () {
      const next = jest.fn((err) => err);
      const req = {
        user: {
          is_admin: false,
        },
      };

      const error = isAdmin(req, {}, next);

      expect(error.message).toBe("Unauthorized");
      expect(error.status).toBe(401);
    });

    test("should not throw an error if user is not an admin", async function () {
      const next = jest.fn((err) => err);
      const req = {
        user: {
          is_admin: true,
        },
      };

      const error = isAdmin(req, {}, next);

      expect(error).toBe(undefined);
    });
  });
});
