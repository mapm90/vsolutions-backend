// mongodb.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Debes definir MONGODB_URI en tu .env');
}

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  // Opciones modernas de conexión para Node >= 18
  const options = {
    // estas opciones aseguran compatibilidad TLS y manejo de topología
    serverApi: { version: '1' }, 
  };

  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

module.exports = clientPromise;
