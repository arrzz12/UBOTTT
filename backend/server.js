import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(cors());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

app.post("/api/chat", async (req, res) => {
    console.log("📥 Received request from frontend");
    const { text, data } = req.body;

    console.log("📝 Text diterima backend:", text);
    console.log("📚 Data terkirim:", data);

    if (!text) {
        return res.json({ reply: "Teks kosong." });
    }

    try {
        console.log("🚀 Mengirim request ke OpenRouter...");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
  model: "meta-llama/llama-3.1-8b-instruct",
  messages: [
    {
      role: "system",
      content: `
        Kamu adalah UBOT, asisten kampus UNKLAB.
        Tugasmu menjawab berdasarkan data berikut:

        DATA UNKLAB:
        ${JSON.stringify(data).slice(0, 3000)}

        - Jangan berhalusinasi
        - Jika jawaban tidak ada di data, jawab dengan sopan: "Data tersebut tidak tersedia."
        - Jawaban harus rapi dan jelas.
      `
    },
    { role: "user", content: text }
                ]
            })
        });

        const json = await response.json();

        console.log("🤖 Response dari OpenRouter:", json);

        if (!json || !json.choices || !json.choices[0]) {
            return res.json({ reply: "AI error, silahkan coba lagi." });
        }

        const reply = json.choices[0].message.content;

        res.json({ reply });

    } catch (err) {
        console.error("🔥 ERROR di backend:", err);
        return res.json({ reply: "AI error, silahkan coba lagi." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
