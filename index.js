require("dotenv").config(); // <- carga las variables del .env

const express = require("express");
const cors = require("cors");
const clientPromise = require("./mongodb");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: "*", // permite solicitudes desde cualquier IP de la red
  })
);
app.use(express.json());

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});
