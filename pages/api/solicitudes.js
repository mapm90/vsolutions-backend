import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    // ---------------------------
    // Cabeceras CORS
    // ---------------------------
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // ---------------------------
    // Preflight OPTIONS
    // ---------------------------
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // ---------------------------
    // POST real
    // ---------------------------
    if (req.method === "POST") {
      const { nombre, telefono, correo, descripcion, servicio } = req.body;

      if (!nombre || !telefono || !correo || !descripcion || !servicio) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
      }

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
