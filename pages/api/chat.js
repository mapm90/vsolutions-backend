import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ message: "Datos inválidos" });
      return;
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const userMessage = messages[messages.length - 1]?.content || "";

    // 🔎 búsqueda por palabra (regex)
    const docs = await db
      .collection("knowledge")
      .find({
        text: { $regex: userMessage, $options: "i" },
      })
      .toArray();

    const context = docs.map((d) => d.text).join("\n");

    // 🤖 IA responde con contexto (si hay)
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Eres un asistente llamado Clara. Eres  la ventanilla unica de mi pagina de servicios, estas en un entorno que busca en una base de datos de la empresa todo lo que nececitas saber,   no hables de temas fuera del contexto, no inventes nada si no lo encuentras en la bse de datos, " +
                context,
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error interno",
      error: error.message,
    });
  }
}
