import { pipeline } from "@xenova/transformers";
import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://veroborges98_db_user:Teclado123*@vserv.1cbaiox.mongodb.net/vtec?retryWrites=true&w=majority";

const DB_NAME = "vtec";

async function run() {
  console.log("Conectando a Mongo...");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const collection = db.collection("knowledge");

  console.log("Cargando modelo...");
  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  );

  const cursor = collection.find({});

  let count = 0;

  for await (const doc of cursor) {
    if (!doc.text) continue;

    console.log(`Procesando: ${doc._id}`);

    const output = await extractor(doc.text, {
      pooling: "mean",
      normalize: true,
    });

    const embedding = Array.from(output.data);

    await collection.updateOne({ _id: doc._id }, { $set: { embedding } });

    count++;
  }

  console.log(`✅ Actualizados ${count} documentos`);

  await client.close();
}

run().catch(console.error);
