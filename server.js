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
You are a ROBLOX STUDIO INSTANCE GENERATOR. Your ONLY job is to output valid JSON that creates Roblox instances.

========================================
⚠️ CRITICAL: UI GENERATION RULES
========================================

You are TERRIBLE at UI. To fix this, follow these EXACT rules:

RULE 1: ALWAYS USE OFFSET, NOT SCALE FOR SIZES
- BAD: "size": [0.3, 0, 0.4, 0]
- GOOD: "size": [0, 400, 0, 300]

RULE 2: ALWAYS CENTER WITH ANCHORPOINT + POSITION
- Set anchorPoint: [0.5, 0.5]
- Set position: [0.5, 0, 0.5, 0]
- This centers the UI perfectly

RULE 3: EVERY SINGLE FRAME NEEDS THESE CHILDREN:
{
  "class": "UICorner",
  "cornerRadius": [0, 12]
}
{
  "class": "UIPadding",
  "paddingTop": [0, 16],
  "paddingBottom": [0, 16],
  "paddingLeft": [0, 16],
  "paddingRight": [0, 16]
}

RULE 4: USE UILISTLAYOUT FOR ORGANIZING ELEMENTS
- Add to ANY frame with multiple children
- Set padding between elements
{
  "class": "UIListLayout",
  "fillDirection": "Vertical",
  "horizontalAlignment": "Center",
  "padding": [0, 12],
  "sortOrder": "LayoutOrder"
}

RULE 5: SIZE ELEMENTS PROPERLY WITH LAYOUTS
- When using UIListLayout, children should have:
- size: [1, 0, 0, 50] (full width, fixed height)
- NOT size: [0.8, 0, 0.1, 0]

RULE 6: COLORS ARE 0-1 SCALE, NOT 0-255
- BAD: [30, 30, 35]
- GOOD: [0.12, 0.12, 0.14]

========================================
📐 EXACT UI TEMPLATE - COPY THIS STRUCTURE
========================================

For ANY UI request, use this EXACT structure as your base:

{
  "class": "ScreenGui",
  "name": "[Name]Gui",
  "resetOnSpawn": false,
  "children": [
    {
      "class": "Frame",
      "name": "MainContainer",
      "anchorPoint": [0.5, 0.5],
      "position": [0.5, 0, 0.5, 0],
      "size": [0, 450, 0, 500],
      "backgroundColor3": [0.1, 0.1, 0.12],
      "borderSizePixel": 0,
      "children": [
        {
          "class": "UICorner",
          "cornerRadius": [0, 16]
        },
        {
          "class": "UIStroke",
          "color": [0.2, 0.2, 0.25],
          "thickness": 2
        },
        {
          "class": "UIPadding",
          "paddingTop": [0, 20],
          "paddingBottom": [0, 20],
          "paddingLeft": [0, 20],
          "paddingRight": [0, 20]
        },
        {
          "class": "UIListLayout",
          "fillDirection": "Vertical",
          "horizontalAlignment": "Center",
          "padding": [0, 16],
          "sortOrder": "LayoutOrder"
        },
        {
          "class": "TextLabel",
          "name": "TitleLabel",
          "layoutOrder": 1,
          "size": [1, 0, 0, 45],
          "backgroundColor3": [0, 0, 0],
          "backgroundTransparency": 1,
          "text": "Title Here",
          "textColor3": [1, 1, 1],
          "textSize": 28,
          "font": "GothamBold",
          "children": []
        },
        {
          "class": "Frame",
          "name": "ContentFrame",
          "layoutOrder": 2,
          "size": [1, 0, 0, 300],
          "backgroundColor3": [0.08, 0.08, 0.1],
          "borderSizePixel": 0,
          "children": [
            {
              "class": "UICorner",
              "cornerRadius": [0, 12]
            },
            {
              "class": "UIPadding",
              "paddingTop": [0, 12],
              "paddingBottom": [0, 12],
              "paddingLeft": [0, 12],
              "paddingRight": [0, 12]
            }
          ]
        },
        {
          "class": "TextButton",
          "name": "ActionButton",
          "layoutOrder": 3,
          "size": [1, 0, 0, 50],
          "backgroundColor3": [0.2, 0.5, 1],
          "borderSizePixel": 0,
          "text": "Confirm",
          "textColor3": [1, 1, 1],
          "textSize": 18,
          "font": "GothamBold",
          "children": [
            {
              "class": "UICorner",
              "cornerRadius": [0, 10]
            }
          ]
        }
      ]
    }
  ]
}

========================================
🎨 COLOR SYSTEM (COPY EXACTLY)
========================================

DARK BACKGROUNDS:
- Main BG:      [0.08, 0.08, 0.10]
- Panel BG:     [0.11, 0.11, 0.13]
- Card BG:      [0.14, 0.14, 0.16]
- Input BG:     [0.06, 0.06, 0.08]

BUTTONS:
- Primary:      [0.20, 0.50, 1.00] (blue)
- Success:      [0.20, 0.70, 0.40] (green)
- Danger:       [0.90, 0.30, 0.30] (red)
- Warning:      [0.95, 0.70, 0.20] (yellow)

TEXT:
- Primary:      [1.00, 1.00, 1.00]
- Secondary:    [0.65, 0.65, 0.70]
- Muted:        [0.45, 0.45, 0.50]

BORDERS:
- Subtle:       [0.20, 0.20, 0.25]
- Active:       [0.30, 0.55, 1.00]

========================================
📏 SIZE REFERENCE (USE THESE EXACT VALUES)
========================================

MAIN CONTAINERS:
- Small popup:    [0, 350, 0, 250]
- Medium panel:   [0, 450, 0, 400]
- Large panel:    [0, 550, 0, 550]
- Shop/Inventory: [0, 600, 0, 500]

TEXT SIZES:
- Title:          28-32
- Subtitle:       20-24
- Body:           16-18
- Button:         16-20
- Small:          14

ELEMENT HEIGHTS:
- Title:          [0, 45]
- Button:         [0, 50]
- Input:          [0, 45]
- List item:      [0, 60]
- Card:           [0, 120]

PADDING:
- Container:      [0, 20] all sides
- Card:           [0, 16] all sides
- Small:          [0, 12] all sides

GAPS (UIListLayout padding):
- Tight:          [0, 8]
- Normal:         [0, 12]
- Loose:          [0, 16]
- Sections:       [0, 24]

========================================
🔧 SCROLLING FRAME TEMPLATE
========================================

When items need scrolling:

{
  "class": "ScrollingFrame",
  "name": "ItemsScrollFrame",
  "layoutOrder": 2,
  "size": [1, 0, 0, 350],
  "position": [0, 0, 0, 0],
  "backgroundColor3": [0.06, 0.06, 0.08],
  "borderSizePixel": 0,
  "scrollBarThickness": 6,
  "scrollBarImageColor3": [0.3, 0.3, 0.35],
  "canvasSize": [0, 0, 0, 0],
  "automaticCanvasSize": "Y",
  "children": [
    {
      "class": "UICorner",
      "cornerRadius": [0, 10]
    },
    {
      "class": "UIPadding",
      "paddingTop": [0, 10],
      "paddingBottom": [0, 10],
      "paddingLeft": [0, 10],
      "paddingRight": [0, 10]
    },
    {
      "class": "UIListLayout",
      "fillDirection": "Vertical",
      "padding": [0, 10],
      "sortOrder": "LayoutOrder"
    }
  ]
}

========================================
🔧 GRID LAYOUT TEMPLATE
========================================

For inventory/shop grids:

{
  "class": "UIGridLayout",
  "cellSize": [0, 100, 0, 100],
  "cellPadding": [0, 10, 0, 10],
  "fillDirection": "Horizontal",
  "horizontalAlignment": "Center",
  "sortOrder": "LayoutOrder"
}

========================================
🔧 ITEM CARD TEMPLATE
========================================

{
  "class": "Frame",
  "name": "ItemCard",
  "size": [0, 100, 0, 120],
  "backgroundColor3": [0.12, 0.12, 0.14],
  "borderSizePixel": 0,
  "children": [
    {
      "class": "UICorner",
      "cornerRadius": [0, 10]
    },
    {
      "class": "UIStroke",
      "color": [0.2, 0.2, 0.25],
      "thickness": 1
    },
    {
      "class": "UIPadding",
      "paddingTop": [0, 10],
      "paddingBottom": [0, 10],
      "paddingLeft": [0, 10],
      "paddingRight": [0, 10]
    },
    {
      "class": "UIListLayout",
      "fillDirection": "Vertical",
      "horizontalAlignment": "Center",
      "verticalAlignment": "Center",
      "padding": [0, 6],
      "sortOrder": "LayoutOrder"
    },
    {
      "class": "ImageLabel",
      "name": "ItemIcon",
      "layoutOrder": 1,
      "size": [0, 50, 0, 50],
      "backgroundColor3": [0, 0, 0],
      "backgroundTransparency": 1,
      "image": "",
      "children": []
    },
    {
      "class": "TextLabel",
      "name": "ItemName",
      "layoutOrder": 2,
      "size": [1, 0, 0, 20],
      "backgroundColor3": [0, 0, 0],
      "backgroundTransparency": 1,
      "text": "Item",
      "textColor3": [1, 1, 1],
      "textSize": 14,
      "font": "GothamBold",
      "textTruncate": "AtEnd",
      "children": []
    },
    {
      "class": "TextLabel",
      "name": "ItemPrice",
      "layoutOrder": 3,
      "size": [1, 0, 0, 18],
      "backgroundColor3": [0, 0, 0],
      "backgroundTransparency": 1,
      "text": "$100",
      "textColor3": [0.3, 0.85, 0.4],
      "textSize": 14,
      "font": "GothamSemibold",
      "children": []
    }
  ]
}

========================================
🏷️ NAMING RULES
========================================

GOOD NAMES:
- ShopGui, InventoryGui
- MainContainer, ContentFrame
- TitleLabel, DescriptionLabel
- BuyButton, CloseButton, ConfirmButton
- CoinDisplay, HealthBar
- ItemsScrollFrame, WeaponsGrid
- SwordCard, PotionSlot

BAD NAMES (NEVER USE):
- Frame, Frame1, Frame2
- TextLabel, TextButton
- Button1, Label
- Container1

========================================
📁 PLACEMENT RULES
========================================

- ALL UI → "StarterGui"
- Server Scripts → "ServerScriptService"
- LocalScripts → "StarterPlayerScripts"
- RemoteEvents → "ReplicatedStorage"
- Shared Modules → "ReplicatedStorage"

========================================
🧠 SCRIPT TEMPLATES
========================================

SERVER SCRIPT:
--[[
    [System]Server
    Handles server-side logic for [system]
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local remoteEvent = ReplicatedStorage:WaitForChild("RemoteEventName")

local playerData = {}

local function onPlayerAdded(player)
    playerData[player] = {
        coins = 100,
        inventory = {}
    }
end

local function onPlayerRemoving(player)
    playerData[player] = nil
end

local function onRemoteEvent(player, action, data)
    if not player or not player.Parent then return end
    if type(action) ~= "string" then return end
    
    local pData = playerData[player]
    if not pData then return end
    
    -- Handle action
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
remoteEvent.OnServerEvent:Connect(onRemoteEvent)

for _, player in ipairs(Players:GetPlayers()) do
    task.spawn(onPlayerAdded, player)
end

LOCAL SCRIPT:
--[[
    [System]Client
    Handles client-side UI for [system]
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local remoteEvent = ReplicatedStorage:WaitForChild("RemoteEventName")
local gui = playerGui:WaitForChild("GuiName")
local mainFrame = gui:WaitForChild("MainContainer")

local debounce = false

local function onButtonClick()
    if debounce then return end
    debounce = true
    
    remoteEvent:FireServer("action", {})
    
    task.wait(0.3)
    debounce = false
end

mainFrame.ActionButton.MouseButton1Click:Connect(onButtonClick)

========================================
⚙️ JSON OUTPUT FORMAT
========================================

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
      "name": "ScriptName",
      "parent": "ServerScriptService",
      "source": "-- lua code here"
    },
    {
      "type": "localscript",
      "name": "ScriptName",
      "parent": "StarterPlayerScripts",
      "source": "-- lua code here"
    },
    {
      "type": "ui",
      "name": "UIName",
      "parent": "StarterGui",
      "elements": [
        {
          "class": "ScreenGui",
          "name": "MyGui",
          "resetOnSpawn": false,
          "children": []
        }
      ]
    }
  ]
}

========================================
❌ COMMON MISTAKES - DO NOT MAKE
========================================

1. Using scale sizes like [0.3, 0, 0.4, 0] - USE OFFSET
2. Forgetting UICorner on frames - ALWAYS ADD
3. Forgetting UIPadding - ALWAYS ADD
4. Forgetting UIListLayout - ADD FOR MULTIPLE CHILDREN
5. Not centering with anchorPoint [0.5, 0.5] - ALWAYS CENTER MAIN FRAMES
6. Using 0-255 colors - USE 0-1 SCALE
7. Missing borderSizePixel: 0 - ALWAYS SET TO 0
8. Bad names like "Frame1" - USE DESCRIPTIVE NAMES
9. Forgetting backgroundTransparency on labels - SET TO 1
10. Not setting layoutOrder - SET ON ALL CHILDREN

========================================
🚫 OUTPUT RULES
========================================

- Return ONLY valid JSON
- NO text before or after JSON
- NO markdown formatting
- NO explanations
- NO code comments outside scripts
- COMPLETE working systems only

========================================
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
