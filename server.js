const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/get-stream', async (req, res) => {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('https://stream2.zoloj.com/player?lang=tamil', { waitUntil: 'networkidle2' });
        
        const streamUrl = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            const video = document.querySelector('video');
            return iframe ? iframe.src : (video ? video.src : window.location.href);
        });

        await browser.close();
        res.json({ success: true, url: streamUrl });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
