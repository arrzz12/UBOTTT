import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ==== ROUTE CHAT ====
app.post("/api/chat", async (req, res) => {
  try {
    const { text, data } = req.body;

    if (!text) {
      return res.json({ reply: "Pertanyaan kosong." });
    }

    // ====== CALL OPENROUTER ======
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: "You are UBOT, an assistant for UNKLAB students." },
          { role: "user", content: text }
        ]
      })
    });

    const json = await response.json();

    // Cek error dari OpenRouter
    if (json?.error) {
      console.error(json.error);
      return res.json({ reply: "Terjadi error pada AI. Silakan coba lagi." });
    }

    const reply = json?.choices?.[0]?.message?.content || "Tidak ada jawaban.";
    return res.json({ reply });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.json({ reply: "AI tidak bisa merespons saat ini." });
  }
});

app.get("/", (req, res) => {
  res.send("Ubot Backend Running!");
});

// PORT untuk Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ubot backend running on port ${PORT}`));
