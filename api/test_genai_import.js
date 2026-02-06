try {
    const genai = require("@google/genai");
    console.log("Required @google/genai:", genai);
    if (genai.Client) {
        console.log("Client is available.");
        try {
            new genai.Client({ apiKey: "test" });
            console.log("Client can be instantiated.");
        } catch (e) {
            console.log("Error instantiating Client:", e.message);
        }
    } else {
        console.log("Client is NOT in exports.");
    }
} catch (e) {
    console.error("Error requiring @google/genai:", e);
}
