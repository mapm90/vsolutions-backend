import clientPromise from "../mongodb";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { nombre, telefono, correo, asunto, mensaje } = req.body;

    if (!nombre || !correo || !asunto || !mensaje) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    try {
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
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error al enviar el mensaje", error: error.message });
    }
  } else {
    res.status(405).json({ message: "Método no permitido" });
  }
}
