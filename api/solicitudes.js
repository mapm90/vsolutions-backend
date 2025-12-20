import clientPromise from "../mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nombre, telefono, correo, descripcion, servicio } = req.body;

    if (!nombre || !telefono || !correo || !descripcion || !servicio) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const nuevaSolicitud = {
        nombre,
        telefono,
        correo,
        descripcion,
        servicio,
        fecha: new Date(),
        vista: false,
      };
      const result = await db
        .collection("solicitudes")
        .insertOne(nuevaSolicitud);
      return res.status(201).json({
        message: "Solicitud enviada",
        id: result.insertedId.toString(),
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          message: "Error al enviar la solicitud",
          error: error.message,
        });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
