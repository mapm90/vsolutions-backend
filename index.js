// backend/index.js
const express = require("express");
const cors = require("cors");
const clientPromise = require("./mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 4000;

// ----------------- Middlewares -----------------
app.use(
  cors({
    origin: "*", // Cambia esto a tu frontend en producción
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ----------------- Ruta de login -----------------
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const user = await db.collection("users").findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Credenciales incorrectas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Credenciales incorrectas" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en login" });
  }
});

// ----------------- Rutas públicas -----------------
app.get("/tipss", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("tips");
    const data = await collection.find({}).toArray();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/comentss", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("comentarios");
    const data = await collection.find({}).toArray();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
});

app.post("/solicitudes", async (req, res) => {
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
    const result = await db.collection("solicitudes").insertOne(nuevaSolicitud);
    res
      .status(201)
      .json({ message: "Solicitud enviada", id: result.insertedId.toString() });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al enviar la solicitud", error: error.message });
  }
});

app.post("/contacto", async (req, res) => {
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
    res
      .status(201)
      .json({ message: "Mensaje enviado", id: result.insertedId.toString() });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al enviar el mensaje", error: error.message });
  }
});

app.post("/comentario", async (req, res) => {
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
    res.status(201).json({
      message: "Comentario enviado",
      id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al enviar el mensaje", error: error.message });
  }
});

// ----------------- Middleware de autenticación -----------------
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No autorizado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Token inválido" });
  }
}

// ----------------- Rutas protegidas -----------------
app.get("/dashboard/solicitudes", authMiddleware, async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const data = await db.collection("solicitudes").find({}).toArray();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno" });
  }
});

// ----------------- Iniciar servidor -----------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor backend corriendo en http://0.0.0.0:${PORT}`);
});
