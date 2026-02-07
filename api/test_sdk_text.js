const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

async function test() {
    const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
    try {
        const result = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: 'user', parts: [{ text: "Hola" }] }]
        });
        console.log("RESULT KEYS:", Object.keys(result));
        if (result.response) console.log("RESPONSE KEYS:", Object.keys(result.response));

        // Try accessing text
        try {
            console.log("Attempting result.text():", result.text());
        } catch (e) {
            console.log("result.text() FAILED:", e.message);
        }

        try {
            console.log("Attempting result.response.text():", result.response.text());
        } catch (e) {
            console.log("result.response.text() FAILED:", e.message);
        }

        if (result.candidates) {
            console.log("CANDIDATE 0 TEXT:", result.candidates[0].content.parts[0].text);
        }
    } catch (error) {
        console.error("ERROR:", error);
    }
}
test();
