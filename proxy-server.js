// 简单的CORS代理服务器
// 使用方法：node proxy-server.js

const http = require('http');
const https = require('https');

const PORT = 8080;

const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/messages') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const apiKey = data.apiKey;
                delete data.apiKey;

                const options = {
                    hostname: 'api.anthropic.com',
                    path: '/v1/messages',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    }
                };

                const proxyReq = https.request(options, proxyRes => {
                    res.writeHead(proxyRes.statusCode, proxyRes.headers);
                    proxyRes.pipe(res);
                });

                proxyReq.on('error', error => {
                    console.error('代理请求错误:', error);
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: error.message }));
                });

                proxyReq.write(JSON.stringify(data));
                proxyReq.end();

            } catch (error) {
                console.error('解析错误:', error);
                res.writeHead(400);
                res.end(JSON.stringify({ error: '请求格式错误' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`✅ CORS代理服务器运行在 http://localhost:${PORT}`);
    console.log(`📝 现在可以打开 脚本生成工具.html 使用了`);
});
