// pages/api/comentarios.js
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  // ---------------------------
  // Cabeceras CORS
  // ---------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ---------------------------
  // Preflight (OPTIONS)
  // ---------------------------
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // ---------------------------
    // GET: obtener todos los comentarios
    // ---------------------------
    if (req.method === "GET") {
      const data = await db.collection("comentarios").find({}).toArray();
      return res.status(200).json({ success: true, data });
    }

    // ---------------------------
    // POST: agregar un nuevo comentario
    // ---------------------------
    if (req.method === "POST") {
      const { nombre, comentario } = req.body;

      if (!nombre || !comentario) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
      }

      const nuevoComentario = {
        nombre,
        comentario,
        fecha: new Date(),
        aprobado: false,
      };

      const result = await db
        .collection("comentarios")
        .insertOne(nuevoComentario);

      return res.status(201).json({
        message: "Comentario enviado",
        id: result.insertedId.toString(),
      });
    }

    // ---------------------------
    // PUT: aprobar o rechazar un comentario
    // ---------------------------
    if (req.method === "PUT") {
      const { id, aprobado } = req.body;

      if (!id || typeof aprobado !== "boolean") {
        return res
          .status(400)
          .json({ message: "Se requiere id y estado aprobado" });
      }

      const result = await db
        .collection("comentarios")
        .updateOne({ _id: new ObjectId(id) }, { $set: { aprobado: aprobado } });

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }

      return res
        .status(200)
        .json({ message: `Comentario ${aprobado ? "aprobado" : "rechazado"}` });
    }

    // ---------------------------
    // DELETE: eliminar uno o varios comentarios
    // ---------------------------
    if (req.method === "DELETE") {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res
          .status(400)
          .json({ message: "Se requiere un arreglo de ids a eliminar" });
      }

      const objectIds = ids.map((id) => new ObjectId(id));

      const result = await db
        .collection("comentarios")
        .deleteMany({ _id: { $in: objectIds } });

      return res.status(200).json({
        message: `Se eliminaron ${result.deletedCount} comentario(s)`,
      });
    }

    // ---------------------------
    // Métodos no permitidos
    // ---------------------------
    return res.status(405).json({ message: "Método no permitido" });
  } catch (error) {
    // ---------------------------
    // Error interno
    // ---------------------------
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }
}
