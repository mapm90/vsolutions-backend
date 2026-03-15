import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ message: "Método no permitido" });

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const categories = await db.collection("tips").distinct("category");
    return res
      .status(200)
      .json({ success: true, data: ["Todos", ...categories.sort()] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno", error: error.message });
  }
}
