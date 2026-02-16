// functions/api/chat.js
export async function onRequestPost(context) {
    const { env, request } = context;
    const { prompt, system } = await request.json();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: system }] }
        })
    });

    const data = await response.json();
    return new Response(JSON.stringify({ result: data.candidates[0].content.parts[0].text }), {
        headers: { "Content-Type": "application/json" }
    });
}