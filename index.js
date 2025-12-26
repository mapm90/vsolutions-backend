const express = require("express");
const cors = require("cors");
const clientPromise = require("./mongodb");

const app = express();
const PORT = 4000;

// Middleware
app.use(
  cors({
    origin: "*", // permite solicitudes desde cualquier IP de la red
  })
);
app.use(express.json());

// RUTA GET / Tips
app.get("/tipss", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("tips");
    const data = await collection.find({}).toArray();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error al obtener tips:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

// RUTA GET / comentarios
app.get("/comentss", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("comentarios");
    const data = await collection.find({}).toArray();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error al obtener tips:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

// RUTA POST /solicitudes
app.post("/solicitudes", async (req, res) => {
  const { nombre, telefono, correo, descripcion, servicio } = req.body;

  if (!nombre || !telefono || !correo || !descripcion || !servicio) {
    console.warn("Faltan datos en solicitud:", req.body);
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
    const result = await db.collection("solicitudes").insertOne(nuevaSolicitud);
    console.log("Solicitud insertada con ID:", result.insertedId.toString());
    return res
      .status(201)
      .json({ message: "Solicitud enviada", id: result.insertedId.toString() });
  } catch (error) {
    console.error("Error al insertar en MongoDB:", error);
    return res
      .status(500)
      .json({ message: "Error al enviar la solicitud", error: error.message });
  }
});

// RUTA POST /contacto
app.post("/contacto", async (req, res) => {
  const { nombre, telefono, correo, asunto, mensaje } = req.body;

  if (!nombre || !correo || !asunto || !mensaje) {
    console.warn("Faltan datos en contacto:", req.body);
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
    console.log("Contacto insertado con ID:", result.insertedId.toString());
    return res
      .status(201)
      .json({ message: "Mensaje enviado", id: result.insertedId.toString() });
  } catch (error) {
    console.error("Error al insertar en MongoDB:", error);
    return res
      .status(500)
      .json({ message: "Error al enviar el mensaje", error: error.message });
  }
});

// RUTA POST /comentario
app.post("/comentario", async (req, res) => {
  const { nombre, comentario } = req.body;

  if (!nombre || !comentario) {
    console.warn("Faltan datos en comentario:", req.body);
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
    console.log("Comentario insertado con ID:", result.insertedId.toString());
    return res.status(201).json({
      message: "Comentario enviado",
      id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error al insertar en MongoDB:", error);
    return res
      .status(500)
      .json({ message: "Error al enviar el mensaje", error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor backend corriendo en http://0.0.0.0:${PORT}`);
});
