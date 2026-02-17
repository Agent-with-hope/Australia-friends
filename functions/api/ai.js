// functions/api/ai.js - 调试版
export async function onRequest(context) {
    // 1. 处理 CORS
    if (context.request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    // 2. 检查环境变量 (这一步最容易出错)
    const apiKey = context.env.ZHIPU_API_KEY;
    if (!apiKey) {
        console.error("❌ 错误: 环境变量 ZHIPU_API_KEY 未找到！");
        return new Response(JSON.stringify({ 
            result: "配置错误: Cloudflare 后台没有找到 ZHIPU_API_KEY，请检查设置并重新部署！" 
        }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    try {
        const reqBody = await context.request.json();
        const { prompt, systemPrompt } = reqBody;

        console.log("正在请求智谱AI...");

        // 3. 调用智谱 AI
        const zhipuResponse = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "glm-4-flash",
                messages: [
                    { role: "system", content: systemPrompt || "你是一个助手。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        // 4. 处理智谱的错误返回
        if (!zhipuResponse.ok) {
            const errorText = await zhipuResponse.text();
            console.error("❌ 智谱API报错:", zhipuResponse.status, errorText);
            return new Response(JSON.stringify({ 
                result: `AI 接口报错 (${zhipuResponse.status}): ${errorText}` 
            }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        const data = await zhipuResponse.json();
        
        // 5. 检查返回数据结构
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("❌ 智谱返回数据格式异常:", JSON.stringify(data));
            return new Response(JSON.stringify({ result: "AI 返回了无法解析的数据。" }), { status: 500 });
        }

        const aiText = data.choices[0].message.content;

        return new Response(JSON.stringify({ result: aiText }), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            }
        });

    } catch (error) {
        console.error("❌ 代码运行异常:", error.message);
        return new Response(JSON.stringify({ 
            result: `服务器内部代码错误: ${error.message}` 
        }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json", 
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}
