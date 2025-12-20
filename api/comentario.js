import clientPromise from "../mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nombre, comentario } = req.body;

    if (!nombre || !comentario) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
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
    } catch (error) {
      return res
        .status(500)
        .json({
          message: "Error al enviar el comentario",
          error: error.message,
        });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
