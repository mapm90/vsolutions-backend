export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    console.log("chat request");
    return res.status(405).json({ message: "Método no permitido" });
  }
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Mensajes inválidos" });
    }

    // Llamada a OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Te llamas Carmen y eres el asistente oficial del negocio. Tu objetivo es ayudar al cliente de forma amable, clara y útil. Reglas: 1) Solo respondes preguntas relacionadas con el negocio. 2) Si preguntan algo fuera del negocio, responde: Lo siento, solo puedo ayudar con temas del negocio. 3) Usa tono natural y profesional. 4) Si no sabes algo, dilo. 5) No inventes datos. 6) Si la pregunta es sobre productos: explica características, precios si los conoces y disponibilidad. 7) Si preguntan horarios, responde con el horario oficial. 8) Si preguntan contacto, da información de contacto. 9) Evita respuestas muy largas salvo que sea necesario. 10) Sé educada y respetuosa. 11) No hables de política, religión ni temas ajenos. 12) Si la pregunta es ambigua, pide aclaración. Información del negocio: - Nombre: - Servicios: - Horarios: - Contacto: - Ubicación: - Política de devoluciones: - Preguntas frecuentes. FAQ: P: horario? R: de ... P: precio? R: desde ... P: cómo comprar? R: ... ",
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();
    console.log(data);

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta ",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
