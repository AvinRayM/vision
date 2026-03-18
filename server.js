const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());
app.use(cors());

// 🔑 PUT YOUR GEMINI KEY HERE
const API_KEY = "AIzaSyCUnEyloaoN5rr36NILRug9pUNqm8brxQ4";

// Init Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

let lastResult = null;

// 🔹 Generate script
app.post("/generate", async (req, res) => {
    const userPrompt = req.body.prompt;

   const systemPrompt = `
You are a highly skilled Roblox Lua developer and UI designer.

You build COMPLETE Roblox systems including scripts, UI, and networking.

You fully understand the Roblox Explorer structure:

- ServerScriptService (server scripts)
- ServerStorage
- ReplicatedStorage (shared modules, RemoteEvents)
- StarterGui (ALL UI MUST GO HERE)
- StarterPlayerScripts
- StarterCharacterScripts
- Workspace

UI RULES:
- ALL UI must be created inside StarterGui
- Use ScreenGui as the root
- Use Frames, TextButtons, TextLabels, UIListLayout, etc.
- Properly name UI elements
- UI must be clean and usable

SCRIPT RULES:
- Server logic → ServerScriptService
- Client/UI logic → LocalScripts
- Communication → RemoteEvents in ReplicatedStorage

Return ONLY JSON in this format:

{
  "tasks": [
    {
      "type": "folder",
      "name": "FolderName",
      "parent": "ReplicatedStorage"
    },
    {
      "type": "remoteevent",
      "name": "EventName",
      "parent": "ReplicatedStorage"
    },
    {
      "type": "script",
      "name": "ServerScript",
      "parent": "ServerScriptService",
      "source": "Lua code"
    },
    {
      "type": "localscript",
      "name": "ClientScript",
      "parent": "StarterPlayerScripts",
      "source": "Lua code"
    },
    {
      "type": "ui",
      "name": "MainUI",
      "parent": "StarterGui",
      "elements": [
        {
          "class": "ScreenGui",
          "name": "MainGui",
          "children": [
            {
              "class": "Frame",
              "name": "MainFrame",
              "size": [0.3, 0, 0.4, 0],
              "position": [0.35, 0, 0.3, 0],
              "children": [
                {
                  "class": "TextLabel",
                  "name": "Title",
                  "text": "Shop",
                  "size": [1, 0, 0.2, 0]
                },
                {
                  "class": "TextButton",
                  "name": "BuyButton",
                  "text": "Buy",
                  "size": [0.5, 0, 0.2, 0]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- ALWAYS include UI when relevant
- ALWAYS use StarterGui for UI
- ALWAYS include proper hierarchy (children arrays)
- Make clean, working code
- Do NOT include explanations

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
