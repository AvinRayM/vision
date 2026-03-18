const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());
app.use(cors());

// 🔑 PUT YOUR GEMINI KEY HERE
const API_KEY = "AIzaSyB2VUFLl0Yi8AA5KgX6Hwz3aMazQNxB44g";

// Init Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

let lastResult = null;

// 🔹 Generate script
app.post("/generate", async (req, res) => {
    const userPrompt = req.body.prompt;

    const systemPrompt = `
You are a Roblox Lua generator.

Return ONLY valid JSON:
{
  "scriptName": "Name",
  "source": "Lua code",
  "location": "ServerScriptService"
}

Task: ${userPrompt}
`;

    try {
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        let parsed;

        try {
            parsed = JSON.parse(text);
        } catch {
            console.log("Bad JSON from AI:", text);

            parsed = {
                scriptName: "AIScript",
                source: text,
                location: "ServerScriptService"
            };
        }

        lastResult = parsed;

        res.json({ success: true, data: parsed });

    } catch (err) {
        console.log("Gemini Error:", err);

        lastResult = {
            scriptName: "ErrorScript",
            source: `warn("AI Error: ${err.message}")`,
            location: "ServerScriptService"
        };

        res.status(500).json({ success: false });
    }
});

// 🔹 Get latest script
app.get("/latest", (req, res) => {
    res.json(lastResult || {});
});

// 🔹 Render PORT FIX
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});