const db = require("../../db");
const app = require("../../app");
const request = require("supertest");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config");

describe("Test Auth Routes", () => {
  beforeEach(async function () {
    await db.query(`DELETE FROM users`);

    const hashedPassword = await bcrypt.hash(
      "unhashedPassword1",
      BCRYPT_WORK_FACTOR
    );

    const hashedPassword2 = await bcrypt.hash(
      "unhashedPassword2",
      BCRYPT_WORK_FACTOR
    );

    await db.query(
      `
      INSERT INTO users (username, password, first_name, last_name, email, photo_url)
      VALUES ('testUser', $1, 'Test', 'User', 'testUser@test.com', 'https://bit.ly/fakeURL');
    `,
      [hashedPassword]
    );

    await db.query(
      `
      INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin)
      VALUES ('adminUser', $1, 'Admin', 'User', 'adminUser@test.com', 'https://bit.ly/fakeURL', true);
    `,
      [hashedPassword2]
    );
  });

  describe("POST /login - Logs in user", () => {
    test("should log in user and return JSON token", async function () {
      const response = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "unhashedPassword2",
      });
      const token = response.body;

      expect(response.statusCode).toBe(200);
      expect(token).toEqual({ token: expect.any(String) });
    });

    test("should throw error if information is wrong", async function () {
      const response = await request(app).post("/auth/login").send({
        username: "adminUser",
        password: "wrongPassword",
      });
      const token = response.body;

      expect(response.statusCode).toBe(400);
      expect(token).toEqual({
        message: "Invalid username or password.",
        status: 400,
      });
    });

    test("should throw error if information is missing", async function () {
      const response = await request(app).post("/auth/login").send({
        password: "unhashedPassword1",
      });
      const token = response.body;

      expect(response.statusCode).toBe(400);
      expect(token).toEqual({
        message: "Invalid username or password.",
        status: 400,
      });
    });
  });

  afterAll(async function () {
    await db.end();
  });
});
