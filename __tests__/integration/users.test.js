const db = require("../../db");
const app = require("../../app");
const request = require("supertest");
const { TOKEN } = require("../../config");

describe("Test User Routes", () => {
  beforeEach(async function () {
    await db.query(`DELETE FROM users`);

    await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email, photo_url)
      VALUES ('testUser1', 'unhashedpassword1', 'One', 'TestOne', 'testOne@test.com', 'https://bit.ly/2LWkdq5');
    `);
  });

  describe("GET /users/ - Gets all users", () => {
    test("should get all users if user is authenticated",
      async function () {
        const response = await request(app)
          .get("/users")
          .query({
            _token: TOKEN
          });
        const users = response.body;

        expect(response.statusCode).toBe(200);
        expect(users).toEqual({
          users: [
            {
              username: "testUser1",
              first_name: "One",
              last_name: "TestOne",
              email: "testOne@test.com"
            }]
        });
      }
    );

    test("should not get all users if user is not authenticated",
      async function () {
        const response = await request(app)
          .get("/users");
        const users = response.body;

        expect(response.statusCode).toBe(401);
        expect(users).toEqual({
          message: "Unauthorized",
          status: 401
        });
      }
    );
  });

  describe("GET /users/:username - gets a specific user", () => {
    test("should get a user if the user is authenticated",
      async function () {
        const response = await request(app)
          .get(`/users/testUser1`)
          .query({
            _token: TOKEN
          });
        const user = response.body;

        expect(response.statusCode).toBe(200);
        expect(user).toEqual({
          user: {
            username: "testUser1",
            first_name: "One",
            last_name: "TestOne",
            email: "testOne@test.com",
            photo_url: "https://bit.ly/2LWkdq5"
          }
        });
      }
    );

    test("should not get a user if the user is not authenticated",
      async function () {
        const response = await request(app)
          .get(`/users/testUser1`);
        const user = response.body;

        expect(response.statusCode).toBe(401);
        expect(user).toEqual({
          message: "Unauthorized",
          status: 401
        });
      }
    );

    test("should throw an error if user was not found",
      async function () {
        const response = await request(app)
          .get("/users/notTestUser1")
          .query({
            _token: TOKEN
          });
        const user = response.body;

        expect(response.statusCode).toBe(404);
        expect(user).toEqual({
          status: 404,
          message: "User not found"
        });
      }
    );
  });

  describe("POST /users/ - creates a new user", () => {
    test("should create new user",
      async function () {
        const response = await request(app)
          .post("/users")
          .send({
            username: "testUser2",
            password: "unhashedPassword2",
            first_name: "Two",
            last_name: "TestTwo",
            email: "testTwo@test.com",
            photo_url: "https://bit.ly/fakeURL"
          });
        const user = response.body;

        expect(response.statusCode).toBe(200);
        expect(user).toEqual({
          token: expect.any(String)
        });
      }
    );

    test("should throw an error with bad inputs",
      async function () {
        const response = await request(app)
          .post("/users")
          .send({
            email: "hi",
            photo_url: "hello"
          });
        const users = response.body;

        expect(response.statusCode).toBe(400);
        expect(users).toEqual({
          status: 400,
          message: [
            "instance requires property \"username\"",
            "instance requires property \"first_name\"",
            "instance requires property \"last_name\"",
            "instance.email does not conform to the \"email\" format",
            "instance.photo_url does not conform to the \"uri\" format"
          ]
        });
      }
    );
  });

  describe("PATCH /users/:id - updates an existing user", () => {
    test("should update a user if authorized",
      async function () {
        const response = await request(app)
          .patch(`/users/testUser1`)
          .send({
            first_name: "OneTest",
            _token: TOKEN
          });
        const user = response.body;

        expect(response.statusCode).toBe(200);
        expect(user).toEqual({
          user: {
            username: "testUser1",
            first_name: "OneTest",
            last_name: "TestOne",
            email: "testOne@test.com",
            photo_url: "https://bit.ly/2LWkdq5"
          }
        });
      }
    );

    test("should not update a user if unauthorized",
      async function () {
        const response = await request(app)
          .patch(`/users/testUser1`)
          .send({
            first_name: "OneTest"
          });
        const user = response.body;

        expect(response.statusCode).toBe(401);
        expect(user).toEqual({
          message: "Unauthorized",
          status: 401
        });
      }
    );

    test("should throw an error if user is not logged in user",
      async function () {
        const response = await request(app)
          .patch("/users/NotTestUser1")
          .send({
            first_name: "OneTest",
            _token: TOKEN
          });
        const user = response.body;

        expect(response.statusCode).toBe(401);
        expect(user).toEqual({
          status: 401,
          message: "Unauthorized"
        });
      }
    );

    test("should throw an error with bad inputs",
      async function () {
        const response = await request(app)
          .patch("/users/testUser1")
          .send({
            email: "hi",
            photo_url: "hello",
            _token: TOKEN
          });
        const users = response.body;

        expect(response.statusCode).toBe(400);
        expect(users).toEqual({
          status: 400,
          message: [
            "instance.email does not conform to the \"email\" format",
            "instance.photo_url does not conform to the \"uri\" format",
          ]
        });
      }
    );
  });

  describe("DELETE /users/:id - deletes the logged in user", () => {
    test("should delete the user",
      async function () {
        const response = await request(app)
          .delete(`/users/testUser1`)
          .send({
            _token: TOKEN
          });
        const user = response.body;
        expect(response.statusCode).toBe(200);
        expect(user).toEqual({
          message: "User deleted"
        });
      }
    );

    test("should not delete the user if unauthorized",
      async function () {
        const response = await request(app)
          .delete(`/users/testUser1`);
        const user = response.body;
        expect(response.statusCode).toBe(401);
        expect(user).toEqual({
          message: "Unauthorized",
          status: 401
        });
      }
    );

    test("should throw an error if user is not logged-in user",
      async function () {
        const response = await request(app)
          .delete("/users/NotTestUser1")
          .send({
            _token: TOKEN
          });
        const user = response.body;

        expect(response.statusCode).toBe(401);
        expect(user).toEqual({
          status: 401,
          message: "Unauthorized"
        });
      }
    );
  });

  afterAll(async function () {
    await db.end();
  });
});