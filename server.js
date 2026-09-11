const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/get-stream', async (req, res) => {
    try {
        const { data } = await axios.get('https://stream2.zoloj.com/player?lang=tamil');
        const $ = cheerio.load(data);
        
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
