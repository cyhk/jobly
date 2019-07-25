const db = require("../../db");
const app = require("../../app");
const request = require("supertest");
const { TOKEN } = require("../../config");

describe("Test Auth Routes", () => {
  beforeEach(async function () {
    await db.query(`DELETE FROM users`);

    await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email, photo_url)
      VALUES ('testUser1', 'unhashedpassword1', 'One', 'TestOne', 'testOne@test.com', 'https://bit.ly/fakeURL');
    `);

    await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin)
      VALUES ('testUser2', 'unhashedpassword2', 'Two', 'TestTwo', 'testTwo@test.com', 'https://bit.ly/fakeURL', true);
    `);
  });
  
  describe("POST /login - Logs in user", () => {
    test("should log in user and return JSON token",
      async function () {
        const response = await request(app)
          .post("/auth/login")
          .send({
            username: "testUser2",
            password: "unhashedPassword2"
        });
        const token = response.body;
        console.log(token);

        expect(response.statusCode).toBe(200);
        expect(token).toEqual({token : expect.any(String)});
      }
    );

    test("should throw error if information is missing",
      async function () {
        const response = await request(app)
          .post("/auth/login")
          .send({
            password: "unhashedPassword1",
        });
        const token = response.body;

        expect(response.statusCode).toBe(400);
        expect(token).toEqual({
          message: "Invalid username or password.",
          status: 400
        });
      }
    );
  });

  afterAll(async function () {
    await db.end();
  });
});