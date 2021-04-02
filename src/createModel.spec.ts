import { createMongooseDBProvider } from "@j.u.p.iter/mongoose-db-provider";
import { Schema } from "mongoose";

import { createModel } from ".";

describe("createModel", () => {
  let userModel;
  let UserSchema;
  let dbProvider;

  beforeAll(async () => {
    dbProvider = createMongooseDBProvider("mongodb://localhost:27017/test");

    await dbProvider.connect();

    UserSchema = new Schema({ name: String, role: String });

    userModel = createModel<{
      _id: Schema.Types.ObjectId;
      name: string;
      role: string;
    }>("User", UserSchema);
  });

  beforeEach(() => {
    dbProvider.clearDB();
  });

  afterAll(() => {
    dbProvider.close();
  });

  describe("create and readOne", () => {
    it("creates new user and searches it properly", async () => {
      const searchingName = "Joe";

      await userModel.create({ name: "Joe" });

      const userFromDB = await userModel.readOne({ name: searchingName });

      expect(userFromDB.name).toBe(searchingName);
    });
  });

  describe("insertMany and readAll", () => {
    it("creates many users and searches them properly", async () => {
      await userModel.insertMany([{ name: "Joe" }, { name: "Bob" }]);

      const usersFromDB = await userModel.readAll();

      expect(usersFromDB.length).toBe(2);
      expect(usersFromDB[0].name).toBe("Joe");
      expect(usersFromDB[1].name).toBe("Bob");
    });
  });

  describe("getTotalCount", () => {
    it("returns correct documents count", async () => {
      const usersData = [
        { name: "Joe" },
        { name: "Bob" },
        { name: "Jane" },
        { name: "Martin" },
        { name: "Jack" }
      ];

      await userModel.insertMany(usersData);

      const totalCount = await userModel.getTotalCount();

      expect(totalCount).toBe(usersData.length);
    });
  });

  describe("readAllBy", () => {
    it("reads data properly", async () => {
      await userModel.insertMany([
        { name: "Joe", role: "admin" },
        { name: "Bob", role: "user" },
        { name: "Jane", role: "user" },
        { name: "Martin", role: "admin" },
        { name: "Jack", role: "admin" }
      ]);

      const users = await userModel.readAllBy({ role: "admin" });

      expect(users.length).toBe(3);
      expect(users[0].name).toBe("Joe");
      expect(users[1].name).toBe("Martin");
      expect(users[2].name).toBe("Jack");
    });

    describe("with sorting by name", () => {
      it("returns all documents, sorted in ascending order", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const totalUsersCount = await userModel.getTotalCount();

        expect(totalUsersCount).toBe(5);

        const users = await userModel.readAllBy(
          { role: "admin" },
          { sortBy: "name" }
        );

        expect(users.length).toBe(3);

        expect(users[0].name).toBe("Jack");
        expect(users[1].name).toBe("Joe");
        expect(users[2].name).toBe("Martin");
      });
    });

    describe("with descending sortDir", () => {
      it("returns all documents, sorted in descending order", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const users = await userModel.readAllBy(
          { role: "admin" },
          { sortBy: "name", sortDir: "desc" }
        );

        expect(users[0].name).toBe("Martin");
        expect(users[1].name).toBe("Joe");
        expect(users[2].name).toBe("Jack");
      });
    });

    describe("with limit equal to 2", () => {
      it("returns 2 documents", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const users = await userModel.readAllBy(
          { role: "admin" },
          { sortBy: "name", limit: 2 }
        );

        expect(users.length).toBe(2);

        expect(users[0].name).toBe("Jack");
        expect(users[1].name).toBe("Joe");
      });
    });

    describe("with offset equals to 2 and limit equals to 1", () => {
      it("returns 1 document", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const users = await userModel.readAllBy(
          { role: "admin" },
          {
            sortBy: "name",
            limit: 1,
            offset: 2
          }
        );

        expect(users.length).toBe(1);
        expect(users[0].name).toBe("Martin");
      });
    });
  });

  describe("readById", () => {
    it("reads data properly", async () => {
      await userModel.insertMany([
        { name: "Joe", role: "admin" },
        { name: "Bob", role: "user" },
        { name: "Jane", role: "user" },
        { name: "Martin", role: "admin" },
        { name: "Jack", role: "admin" }
      ]);

      const userByName = await userModel.readOne({ name: "Bob" });

      const userById = await userModel.readById(userByName.id);

      expect(userById.name).toBe("Bob");
    });
  });

  describe("update", () => {
    it("updates document by id", async () => {
      await userModel.insertMany([
        { name: "Joe", role: "admin" },
        { name: "Bob", role: "user" },
        { name: "Jane", role: "user" },
        { name: "Martin", role: "admin" },
        { name: "Jack", role: "admin" }
      ]);

      const userByName = await userModel.readOne({ name: "Jane" });

      const updatedUser = await userModel.update(userByName.id, {
        name: "Sara"
      });

      expect(userByName.id).toBe(updatedUser.id);
      expect(updatedUser.name).toBe("Sara");
    });
  });

  describe("deleteOne", () => {
    it("deletes document by id", async () => {
      await userModel.insertMany([
        { name: "Joe", role: "admin" },
        { name: "Bob", role: "user" },
        { name: "Jane", role: "user" },
        { name: "Martin", role: "admin" },
        { name: "Jack", role: "admin" }
      ]);

      const userByName = await userModel.readOne({ name: "Martin" });

      const removedUser = await userModel.deleteOne(userByName.id);

      const totalUsersCount = await userModel.getTotalCount();

      expect(totalUsersCount).toBe(4);
      expect(removedUser.name).toBe("Martin");
    });
  });

  describe("deleteAll", () => {
    it("deletes all documents", async () => {
      await userModel.insertMany([
        { name: "Joe", role: "admin" },
        { name: "Bob", role: "user" },
        { name: "Jane", role: "user" },
        { name: "Martin", role: "admin" },
        { name: "Jack", role: "admin" }
      ]);

      let totalUsersCount = await userModel.getTotalCount();

      expect(totalUsersCount).toBe(5);

      await userModel.deleteAll();

      totalUsersCount = await userModel.getTotalCount();

      expect(totalUsersCount).toBe(0);
    });
  });

  describe("read", () => {
    describe("with default params", () => {
      it("returns all documents without sorting", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const users = await userModel.read();

        expect(users.length).toBe(5);

        expect(users[0].name).toBe("Joe");
        expect(users[1].name).toBe("Bob");
        expect(users[2].name).toBe("Jane");
        expect(users[3].name).toBe("Martin");
        expect(users[4].name).toBe("Jack");
      });
    });

    describe("with sorting by name", () => {
      it("returns all documents, sorted in ascending order", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const totalUsersCount = await userModel.getTotalCount();

        expect(totalUsersCount).toBe(5);

        const users = await userModel.read({ sortBy: "name" });

        expect(users.length).toBe(5);

        expect(users[0].name).toBe("Bob");
        expect(users[1].name).toBe("Jack");
        expect(users[2].name).toBe("Jane");
        expect(users[3].name).toBe("Joe");
        expect(users[4].name).toBe("Martin");
      });
    });

    describe("with descending sortDir", () => {
      it("returns all documents, sorted in descending order", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const users = await userModel.read({ sortBy: "name", sortDir: "desc" });

        expect(users[0].name).toBe("Martin");
        expect(users[1].name).toBe("Joe");
        expect(users[2].name).toBe("Jane");
        expect(users[3].name).toBe("Jack");
        expect(users[4].name).toBe("Bob");
      });
    });

    describe("with limit equal to 2", () => {
      it("returns 2 documents", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const users = await userModel.read({ sortBy: "name", limit: 2 });

        expect(users.length).toBe(2);
        expect(users[0].name).toBe("Bob");
        expect(users[1].name).toBe("Jack");
      });
    });

    describe("with offset equal to 3", () => {
      it("returns 2 documents", async () => {
        await userModel.insertMany([
          { name: "Joe", role: "admin" },
          { name: "Bob", role: "user" },
          { name: "Jane", role: "user" },
          { name: "Martin", role: "admin" },
          { name: "Jack", role: "admin" }
        ]);

        const users = await userModel.read({
          sortBy: "name",
          limit: 5,
          offset: 3
        });

        expect(users.length).toBe(2);
        expect(users[0].name).toBe("Joe");
        expect(users[1].name).toBe("Martin");
      });
    });
  });
});
