// Cloudflare Functions 入口
export async function onRequest(context) {
    // 1. 处理 CORS (允许你的网页调用)
    if (context.request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    if (context.request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    // 2. 从 Cloudflare Dashboard 环境变量中获取 Key
    // 注意：变量名必须是 ZHIPU_API_KEY
    const apiKey = context.env.ZHIPU_API_KEY;

    if (!apiKey) {
        return new Response(JSON.stringify({ result: "Server Config Error: Missing API Key" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        const reqBody = await context.request.json();
        const { prompt, systemPrompt } = reqBody;

        // 3. 调用智谱 AI
        const zhipuResponse = await fetch("[https://open.bigmodel.cn/api/paas/v4/chat/completions](https://open.bigmodel.cn/api/paas/v4/chat/completions)", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "glm-4-flash", // 智谱的高速模型
                messages: [
                    { role: "system", content: systemPrompt || "你是一个助手。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 1024
            })
        });

        if (!zhipuResponse.ok) {
            const errorText = await zhipuResponse.text();
            throw new Error(`Zhipu API Error: ${zhipuResponse.status} - ${errorText}`);
        }

        const data = await zhipuResponse.json();
        const aiText = data.choices[0].message.content;

        // 4. 返回结果给前端
        return new Response(JSON.stringify({ result: aiText }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // 允许跨域
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ result: `Error: ${error.message}` }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}