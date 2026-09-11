const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/get-stream', async (req, res) => {
    try {
        // உண்மையான பிரவுசர் போல காட்டி 403 பிழையைத் தவிர்த்தல்
        const response = await axios.get('https://stream2.zoloj.com/player?lang=tamil', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://stream2.zoloj.com/'
            }
        });

        const $ = cheerio.load(response.data);
        
        let streamUrl = '';
        const iframe = $('iframe').attr('src');
        const video = $('video').attr('src');
        
        if (iframe) {
            streamUrl = iframe;
        } else if (video) {
            streamUrl = video;
        } else {
            streamUrl = 'https://stream2.zoloj.com/player?lang=tamil';
        }

        res.json({ success: true, url: streamUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
