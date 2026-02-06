const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || "AIzaSy..."; // Placeholder, will rely on env
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // Note: older SDKs might not have listModels exposed cleanly, 
        // but newer ones usually refer to them via specific endpoints.
        // However, the simplest check is to try a standard model like gemini-1.5-flash
        // and see if we can get a response, OR usually there's a model listing endpoint.
        // Since the SDK wrapper might abstract it, we'll try to find methods.

        // Actually, for the JS SDK, listing models isn't always a direct top-level method.
        // Let's try to access the `modelManager` if it exists, or just catch the error from the main invalid call 
        // which the user already pasted...

        // Better strategy: Attempt to generate content with a few candidates and see which succeeds.
        console.log("Testing common model names for availability...");

        const candidates = [
            "gemini-1.5-flash-8b",
            "gemini-1.5-flash-8b-001",
            "gemini-1.5-flash-8b-latest",
            "gemini-1.5-flash-8b-exp-0827",
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-2.0-flash-lite-preview-02-05"
        ];

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Test");
                console.log(`[PASS] ${modelName} is AVAILABLE.`);
            } catch (error) {
                console.log(`[FAIL] ${modelName}: ${error.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

listModels();
