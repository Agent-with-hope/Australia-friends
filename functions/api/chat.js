// functions/api/chat.js
export async function onRequestPost(context) {
    const { env, request } = context;
    const { prompt, system } = await request.json();

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.ZHIPU_API_KEY}` // 确保 Bearer 后面有个空格
        },
        body: JSON.stringify({
            model: "glm-4-flash",
            messages: [
                { role: "system", content: system || "你是一个赛博助手。" },
                { role: "user", content: prompt }
            ]
        })
    });
    // ...
}
