const db = require("../../db");
const app = require("../../app");
const request = require("supertest");

describe("Test User Routes", () => {
  beforeEach(async function () {
    await db.query(`DELETE FROM users`);

    await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email, photo_url)
      VALUES ('testUser1', 'unhashedpassword1', 'One', 'TestOne', 'testOne@test.com', 'https://bit.ly/2LWkdq5');
    `);
  });
  
  describe("GET /users/ - Gets all users", () => {
    test("should get all users",
      async function () {
        const response = await request(app)
          .get("/users");
        const users = response.body;
        // username, first_name, last_name, email, photo_url
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
  });

  describe("GET /users/:username - gets a specific user", () => {
    test("should get a user",
      async function () {
        const response = await request(app)
          .get(`/users/testUser1`);
        const user = response.body;

        expect(response.statusCode).toBe(200);
        expect(user).toEqual({user: {
          username: "testUser1",
          first_name: "One",
          last_name: "TestOne",
          email: "testOne@test.com",
          photo_url: "https://bit.ly/2LWkdq5"
        }});
      }
    );

    test("should throw an error if user was not found", 
      async function () {
        const response = await request(app)
          .get("/users/notTestUser1");
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
        expect(user).toEqual({user: {
          username: "testUser2",
          first_name: "Two",
          last_name: "TestTwo",
          email: "testTwo@test.com",
          photo_url: "https://bit.ly/fakeURL"
        }});
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
    test("should update a user",
      async function () {
        const response = await request(app)
          .patch(`/users/testUser1`)
          .send({
            first_name: "OneTest"
          });
        const user = response.body;
        
        expect(response.statusCode).toBe(200);
        expect(user).toEqual({ user: {
          username: "testUser1",
          first_name: "OneTest",
          last_name: "TestOne",
          email: "testOne@test.com",
          photo_url: "https://bit.ly/2LWkdq5"
        }});
      }
    );

    test("should throw an error if user was not found", 
      async function () {
        const response = await request(app)
        .patch("/users/NotTestUser1")
        .send({
          first_name: "OneTest"
        });
        const user = response.body;

        expect(response.statusCode).toBe(404);
        expect(user).toEqual({
          status: 404,
          message: "User not found"
        });
      }
    );

    test("should throw an error with bad inputs", 
      async function () {
        const response = await request(app)
          .patch("/users/testUser1")
          .send({
            email: "hi",
            photo_url: "hello"
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

  describe("DELETE /users/:id - deletes an existing user", () => {
    test("should delete a user",
      async function () {
        const response = await request(app)
          .delete(`/users/testUser1`);
        const user = response.body;
        expect(response.statusCode).toBe(200);
        expect(user).toEqual({
          message: "User deleted"
        });
      }
    );

    test("should throw an error if user was not found", 
      async function() {
        const response = await request(app)
          .delete("/users/NotTestUser1");
        const user = response.body;

        expect(response.statusCode).toBe(404);
        expect(user).toEqual({
          status: 404,
          message: "User not found"
        });
      }
    );
  });

  afterAll(async function () {
    await db.end();
  });
});