const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());
app.use(cors());

// 🔑 PUT YOUR GEMINI KEY HERE
const API_KEY = process.env.API_KEY;

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
You are a JSON generator for Roblox Studio. You MUST output a valid JSON object with tasks.

IMPORTANT: You MUST ALWAYS return at least one task. NEVER return an empty tasks array.

========================================
OUTPUT FORMAT - ALWAYS USE THIS:
========================================

{
  "tasks": [
    ... tasks here, NEVER empty ...
  ]
}

========================================
TASK TYPES YOU CAN CREATE:
========================================

1. FOLDER:
{
  "type": "folder",
  "name": "MyFolder",
  "parent": "ReplicatedStorage"
}

2. REMOTE EVENT:
{
  "type": "remoteevent",
  "name": "MyRemoteEvent",
  "parent": "ReplicatedStorage"
}

3. SERVER SCRIPT:
{
  "type": "script",
  "name": "MyServerScript",
  "parent": "ServerScriptService",
  "source": "print('Hello from server')"
}

4. LOCAL SCRIPT:
{
  "type": "localscript",
  "name": "MyLocalScript",
  "parent": "StarterPlayerScripts",
  "source": "print('Hello from client')"
}

5. UI (ScreenGui):
{
  "type": "ui",
  "name": "MyUI",
  "parent": "StarterGui",
  "elements": [
    {
      "class": "ScreenGui",
      "name": "MainGui",
      "resetOnSpawn": false,
      "children": [
        {
          "class": "Frame",
          "name": "MainFrame",
          "anchorPoint": [0.5, 0.5],
          "position": [0.5, 0, 0.5, 0],
          "size": [0, 400, 0, 300],
          "backgroundColor3": [0.1, 0.1, 0.12],
          "borderSizePixel": 0,
          "children": [
            {"class": "UICorner", "cornerRadius": [0, 12]},
            {"class": "UIStroke", "color": [0.2, 0.2, 0.25], "thickness": 2},
            {"class": "UIPadding", "paddingTop": [0, 16], "paddingBottom": [0, 16], "paddingLeft": [0, 16], "paddingRight": [0, 16]},
            {"class": "UIListLayout", "fillDirection": "Vertical", "horizontalAlignment": "Center", "padding": [0, 12], "sortOrder": "LayoutOrder"},
            {
              "class": "TextLabel",
              "name": "TitleLabel",
              "layoutOrder": 1,
              "size": [1, 0, 0, 40],
              "backgroundTransparency": 1,
              "text": "My Title",
              "textColor3": [1, 1, 1],
              "textSize": 24,
              "font": "GothamBold"
            },
            {
              "class": "TextButton",
              "name": "MyButton",
              "layoutOrder": 2,
              "size": [1, 0, 0, 45],
              "backgroundColor3": [0.2, 0.5, 1],
              "borderSizePixel": 0,
              "text": "Click Me",
              "textColor3": [1, 1, 1],
              "textSize": 18,
              "font": "GothamBold",
              "children": [
                {"class": "UICorner", "cornerRadius": [0, 8]}
              ]
            }
          ]
        }
      ]
    }
  ]
}

========================================
PARENT LOCATIONS:
========================================
- UI goes in: "StarterGui"
- Server scripts go in: "ServerScriptService"
- Local scripts go in: "StarterPlayerScripts"
- RemoteEvents go in: "ReplicatedStorage"
- Folders can go in: "ReplicatedStorage", "ServerStorage", "Workspace"

========================================
UI RULES (IMPORTANT):
========================================

1. ALL sizes use OFFSET not scale: [0, 400, 0, 300] ✓
2. Center frames with: anchorPoint [0.5, 0.5] and position [0.5, 0, 0.5, 0]
3. EVERY Frame needs: UICorner, UIPadding
4. Colors are 0-1 scale: [0.1, 0.1, 0.12] ✓ NOT [25, 25, 30] ✗
5. Always set borderSizePixel: 0
6. TextLabels need backgroundTransparency: 1
7. Use UIListLayout when frame has multiple children
8. Set layoutOrder on children when using UIListLayout

========================================
COLORS TO USE:
========================================
Background dark: [0.08, 0.08, 0.1]
Panel: [0.11, 0.11, 0.13]
Card: [0.14, 0.14, 0.16]
Blue button: [0.2, 0.5, 1]
Green button: [0.2, 0.7, 0.4]
Red button: [0.9, 0.3, 0.3]
White text: [1, 1, 1]
Gray text: [0.65, 0.65, 0.7]
Border: [0.2, 0.2, 0.25]

========================================
CRITICAL RULES:
========================================

1. ALWAYS return valid JSON
2. NEVER return empty tasks array
3. NO text outside the JSON
4. NO markdown code blocks
5. NO explanations
6. Build COMPLETE working systems
7. If user asks for UI, include the UI task
8. If user asks for a system, include scripts AND UI AND remotes

========================================
EXAMPLE - If user says "make a shop":
========================================

You return UI for the shop + RemoteEvent + ServerScript + LocalScript.
ALL connected and working together.

========================================
NOW RESPOND TO THIS REQUEST:
========================================

Remember: Output ONLY the JSON object. Start with { and end with }
User wants: 
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
