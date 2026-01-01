// pages/api/comentarios.js
import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  // Cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET
  if (req.method === "GET") {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const data = await db.collection("tips").find({}).toArray();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
    }
  }

  // Otros métodos no permitidos
  res.status(405).json({ message: "Método no permitido" });
}
