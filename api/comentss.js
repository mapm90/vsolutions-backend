import clientPromise from "../mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const data = await db.collection("comentarios").find({}).toArray();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
