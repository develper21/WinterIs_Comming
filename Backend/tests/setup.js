import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongoServer;
let client;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  client = new MongoClient(mongoUri);
  await client.connect();
  
  // Set test database in global scope
  global.testDB = client.db('test_sebn');
  global.mongoServer = mongoServer;
});

afterAll(async () => {
  if (client) {
    await client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clean up database before each test
  const collections = await global.testDB.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});
