const { MongoClient } = require("mongodb");

const uri = "TU_MONGO_URI_AQUI"; // por ejemplo el que da MongoDB Atlas

let client;
let db;

async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    db = client.db("miDatabase"); // cambia nombre de la BD
    return db;
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error);
  }
}

module.exports = { connectDB };
