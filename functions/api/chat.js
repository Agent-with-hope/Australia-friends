// functions/api/chat.js
export async function onRequestPost(context) {
    const { env, request } = context;
    const { prompt, system } = await request.json();

    // 智谱 AI 标准接口地址
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.ZHIPU_API_KEY}` // 从 Cloudflare 环境变量读取密钥
        },
        body: JSON.stringify({
            model: "glm-4-flash", // 使用 glm-4-flash 模型
            messages: [
                { role: "system", content: system || "你是一个赛博老司机助手。" },
                { role: "user", content: prompt }
            ]
        })
    });

    const data = await response.json();
    
    // 适配智谱 AI 的返回格式并封装
    return new Response(JSON.stringify({ 
        result: data.choices[0].message.content 
    }), {
        headers: { "Content-Type": "application/json" }
    });
}
