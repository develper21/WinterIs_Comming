import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client;
let db;
// #region MongoDB Configueration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "sebn_db";

export const connectDB = async () => {
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(DB_NAME);

    const usersCollection = db.collection("users");
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ createdAt: 1 });

    console.log("[DataBase]: MongoDB Connected Successfully");
    return db;
  } catch (error) {
    console.error("[DataBase]: MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error("[DataBase]: Database not initialized. Call connectDB() first.");
  }
  return db;
};

export const disconnectDB = async () => {
  try {
    if (client) {
      await client.close();
      console.log("[DataBase]: MongoDB Disconnected");
    }
  } catch (error) {
    console.error("[DataBase]: MongoDB Disconnection Error:", error.message);
  }
};
