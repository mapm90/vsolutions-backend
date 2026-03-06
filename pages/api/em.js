import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://veroborges98_db_user:Teclado123*@vserv.1cbaiox.mongodb.net/vtec?retryWrites=true&w=majority";

const DB_NAME = "vtec";

// ⚠️ Pon aquí tu API key real de OpenRouter
const OPENROUTER_API_KEY =
  "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";

async function getKeywords(text) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Eres un generador de palabras clave. Devuelve 10 palabras clave separadas por comas. Solo una palabra entre comas, no frases, compuestas , sin explicaciones.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    },
  );

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "";

  return reply
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 10);
}

async function run() {
  console.log("Conectando a Mongo...");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const collection = db.collection("knowledge");

  const cursor = collection.find({});
  let count = 0;

  for await (const doc of cursor) {
    if (!doc.text) continue;

    console.log(`Procesando: ${doc._id}`);

    const pclave = await getKeywords(doc.text);

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: { pclave },
        $unset: { embedding: "" }, // elimina campo embedding
      },
    );

    count++;
  }

  console.log(`✅ Actualizados ${count} documentos`);

  await client.close();
}

run().catch(console.error);
