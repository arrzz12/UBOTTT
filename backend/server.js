import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(cors());

// ===== ROUTE CHAT =====
app.post("/api/chat", async (req, res) => {

  console.log("📥 Received request from frontend");

  const { text, data } = req.body;

  console.log("📝 Text diterima backend:", text);
  console.log("📚 Data UNKLAB:", data);

  if (!text) {
    console.log("❌ ERROR: Text kosong");
    return res.status(400).json({ reply: "Teks kosong." });
  }

  try {
    // ==== Request ke OpenRouter ====
    console.log("🚀 Mengirim request ke OpenRouter...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Kamu adalah chatbot UNKLAB." },
          { role: "user", content: text }
        ]
      })
    });

    const json = await response.json();

    console.log("🤖 Response dari OpenRouter:", json);

    const reply =
      json?.choices?.[0]?.message?.content ||
      "Maaf, saya tidak bisa memahami itu.";

    res.json({ reply });

  } catch (error) {
    console.error("🔥 ERROR di backend:", error);
    res.status(500).json({ reply: "Server error. Coba lagi." });
  }
});

// ===== SERVER LISTEN =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
