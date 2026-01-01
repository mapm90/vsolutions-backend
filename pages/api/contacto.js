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
    // Preflight
    // ---------------------------
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // ---------------------------
    // POST real
    // ---------------------------
    if (req.method === "POST") {
      const { nombre, telefono, correo, asunto, mensaje } = req.body;

      if (!nombre || !correo || !asunto || !mensaje) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
      }

      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      const nuevoContacto = {
        nombre,
        telefono: telefono || "",
        correo,
        asunto,
        mensaje,
        fecha: new Date(),
        visto: false,
      };

      const result = await db.collection("contacto").insertOne(nuevoContacto);

      return res.status(201).json({
        message: "Mensaje enviado",
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
