// functions/api/chat.js
export async function onRequestPost(context) {
    const { env, request } = context;
    const { prompt, system } = await request.json();

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.ZHIPU_API_KEY}`
        },
        body: JSON.stringify({
            model: "glm-4-flash",
            messages: [
                { role: "system", content: system || "你是一个赛博马年贺岁助手。" },
                { role: "user", content: prompt }
            ]
        })
    });

    const data = await response.json();
    return new Response(JSON.stringify({ result: data.choices[0].message.content }), {
        headers: { "Content-Type": "application/json" }
    });
}
