const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/healthcare";
const client = new MongoClient(uri);
const dbName = "healthcare";

async function connectDB() {
  try {
    // Check if the client is already connected
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    console.log("✅ MongoDB Connected Successfully");
    return client.db(dbName);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1); // Exit on failure
  }
}

module.exports = {connectDB,client,dbName};
