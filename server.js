const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// Đường dẫn này sẽ biến link m3u8 thành đuôi .mp4
app.get('/video.mp4', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("Missing URL");

    try {
        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'VLC/3.0.18',
                'Referer': 'https://fptplay.vn/' 
            },
            responseType: 'text'
        });

        let content = response.data;
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        
        const protocol = req.protocol;
        const host = req.get('host');
        const proxyPrefix = `${protocol}://${host}/video.mp4?url=`;

        // Rewrite link con để chạy xuyên suốt qua proxy
        const rewrittenContent = content.replace(/^(?!http)(.*)$/mg, (match) => {
            if (match.trim() && !match.startsWith('#')) {
                return proxyPrefix + encodeURIComponent(baseUrl + match.trim());
            }
            return match;
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(rewrittenContent);
    } catch (error) {
        res.status(500).send("Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));