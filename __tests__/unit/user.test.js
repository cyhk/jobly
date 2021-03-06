const db = require("../../db");
const User = require("../../models/user");

describe("Test User Class", () => {
  beforeEach(async function () {
    await db.query(`DELETE FROM users`);

    await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email, photo_url)
      VALUES ('testUser1', 'unhashedpassword1', 'One', 'TestOne', 'testOne@test.com', 'https://bit.ly/2LWkdq5');
    `);
  });

  describe("create()", () => {
    test("should add user to database", async function () {
      const newUser = {
        username: "testUser2",
        password: "unhashedpassword2",
        first_name: "Two",
        last_name: "TestTwo",
        email: "testTwo@test.com",
        photo_url: "https://bit.ly/fakeURL",
      };
      const user = await User.create(newUser);

      expect(user).toEqual({
        username: "testUser2",
        first_name: "Two",
        last_name: "TestTwo",
        email: "testTwo@test.com",
        photo_url: "https://bit.ly/fakeURL",
      });
    });

    test("should add admin user to database", async function () {
      const newUser = {
        username: "testUser3",
        password: "unhashedpassword3",
        first_name: "Three",
        last_name: "TestThree",
        email: "testThree@test.com",
        photo_url: "https://bit.ly/fakeURLThree",
        is_admin: true,
      };
      const user = await User.create(newUser);

      expect(user).toEqual({
        username: "testUser3",
        first_name: "Three",
        last_name: "TestThree",
        email: "testThree@test.com",
        photo_url: "https://bit.ly/fakeURLThree",
      });
    });
  });

  describe("all()", () => {
    test("get all users", async function () {
      const users = await User.all({});
      expect(users).toEqual([
        {
          username: "testUser1",
          first_name: "One",
          last_name: "TestOne",
          email: "testOne@test.com",
        },
      ]);
    });
  });

  describe("get()", () => {
    test("should get a user", async function () {
      const user = await User.get("testUser1");

      expect(user).toEqual({
        username: "testUser1",
        first_name: "One",
        last_name: "TestOne",
        email: "testOne@test.com",
        photo_url: "https://bit.ly/2LWkdq5",
      });
    });

    test("should throw an error if user was not found", async () => {
      await expect(User.get("notTestUser1")).rejects.toThrow("User not found");
    });
  });

  describe("update()", () => {
    test("should update a user", async function () {
      const valsToUpdate = {
        first_name: "OneTest",
      };
      const user = await User.update("testUser1", valsToUpdate);

      expect(user).toEqual({
        username: "testUser1",
        first_name: "OneTest",
        last_name: "TestOne",
        email: "testOne@test.com",
        photo_url: "https://bit.ly/2LWkdq5",
      });
    });

    test("should throw an error if user was not found", async () => {
      const valsToUpdate = {
        first_name: "OneTest",
      };

      await expect(User.update("NotTestUser1", valsToUpdate)).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("delete()", () => {
    test("should delete a user", async function () {
      const user = await User.delete("testUser1");

      expect(user).toEqual("User deleted");
    });

    test("should throw an error if user was not found", async () => {
      await expect(User.delete("notTestUser1")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("authenticate()", () => {
    const newUser = {
      username: "testUser2",
      password: "unhashedpassword2",
      first_name: "Two",
      last_name: "TestTwo",
      email: "testTwo@test.com",
      photo_url: "https://bit.ly/fakeURL",
    };

    test("no error is thrown if password is correct", async function () {
      await User.create(newUser);

      const result = await User.authenticate("testUser2", "unhashedpassword2");
      expect(result).toBe(undefined);
    });

    test("error is thrown if password is incorrect", async function () {
      await User.create(newUser);

      await expect(
        User.authenticate("testUser2", "badpassword2")
      ).rejects.toThrow("Invalid username or password");
    });
  });

  afterAll(async function () {
    await db.end();
  });
});
