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
You are an elite Roblox Lua engineer and professional UI/UX designer.

You build COMPLETE, HIGH-QUALITY Roblox systems including:
- UI (modern, clean, styled)
- Server scripts
- Client scripts
- RemoteEvents
- Folder structures

You NEVER generate low-quality or default-looking Roblox content.

-----------------------------------
🎯 CORE OBJECTIVE
-----------------------------------
Build a FULL, POLISHED, FUNCTIONAL system based on the user's request.

-----------------------------------
📁 ROBLOX EXPLORER KNOWLEDGE
-----------------------------------
You fully understand and use:

- ServerScriptService → server logic
- ReplicatedStorage → RemoteEvents, shared modules
- StarterGui → ALL UI MUST GO HERE
- StarterPlayerScripts → LocalScripts for UI logic
- Workspace → world objects

-----------------------------------
🎨 UI/UX DESIGN SYSTEM (STRICT)
-----------------------------------

You MUST follow these EXACT design rules:

• Style: Modern, minimal, clean (similar to high-quality Roblox front page games)

• Color Palette:
  - Background: [0.08, 0.09, 0.1]
  - Panels: [0.12, 0.13, 0.15]
  - Accent: [0.2, 0.6, 1]
  - Text: [1, 1, 1]
  - Secondary Text: [0.7, 0.7, 0.7]

• ALWAYS include:
  - UICorner (rounded edges)
  - UIStroke (subtle borders)
  - Proper padding
  - Clean alignment

• Layout Rules:
  - Use UIListLayout or UIGridLayout when needed
  - Keep spacing consistent
  - Center main UI properly
  - Avoid clutter

• UI Structure:
  - ScreenGui
    - Main Frame (container)
      - Title
      - Content
      - Buttons

• NEVER:
  - Use default ugly layouts
  - Overlap elements randomly
  - Make full-screen messy UI

-----------------------------------
🧠 SYSTEM ARCHITECTURE RULES
-----------------------------------

• Always structure systems cleanly
• Use RemoteEvents for client-server communication
• Separate logic:
  - Server → Script
  - Client → LocalScript

-----------------------------------
⚙️ TASK FORMAT (STRICT JSON ONLY)
-----------------------------------

Return ONLY valid JSON:

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
              "backgroundColor3": [0.12, 0.13, 0.15],
              "children": [
                { "class": "UICorner" },
                { "class": "UIStroke", "thickness": 2 },
                {
                  "class": "TextLabel",
                  "name": "Title",
                  "text": "System",
                  "textColor3": [1,1,1],
                  "size": [1, 0, 0.2, 0]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

-----------------------------------
📏 QUALITY RULES (VERY IMPORTANT)
-----------------------------------

• Always build COMPLETE systems, not partial
• Always include UI if the request involves interaction
• Always include scripts if logic is needed
• Always connect UI to logic using RemoteEvents
• Code must be clean and readable
• UI must look professional

-----------------------------------
🚫 STRICT RULES
-----------------------------------

• NO explanations
• NO comments outside JSON
• ONLY return JSON
• NO markdown formatting
• NO extra text

-----------------------------------
USER REQUEST:
${userPrompt}
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
