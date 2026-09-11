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
            executablePath: '/usr/bin/google-chrome-stable',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto('https://stream2.zoloj.com/player?lang=tamil', { waitUntil: 'networkidle2', timeout: 60000 });
        
        // வீடியோ அல்லது ஐபிரேம் லோட் ஆவதற்காக 4 விநாடிகள் காத்திருத்தல்
        await new Promise(resolve => setTimeout(resolve, 4000));

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
