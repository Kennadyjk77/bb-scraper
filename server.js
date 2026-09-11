const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/get-stream', async (req, res) => {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: "new",
            executablePath: '/usr/bin/google-chrome-stable',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        let liveStreamUrl = '';
        
        // நெட்வொர்க்கில் செல்லும் .m3u8 லிங்கைத் தீவிரமாகத் தேடுதல்
        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('.m3u8') || url.includes('playlist')) {
                liveStreamUrl = url;
            }
        });

        await page.goto('https://stream2.zoloj.com/player?lang=tamil', { waitUntil: 'networkidle2', timeout: 60000 });
        
        // பிளேயர் லோட் ஆக சிறிது நேரம் காத்திருத்தல்
        await new Promise(resolve => setTimeout(resolve, 4000));

        // பிளேயர் மீது கிளிக் செய்து வீடியோவை வரவழைத்தல் (Play Trigger)
        try {
            await page.mouse.click(300, 300);
        } catch (e) {}

        // மீண்டும் சில விநாடிகள் காத்திருத்தல்
        await new Promise(resolve => setTimeout(resolve, 5000));

        // நெட்வொர்க்கில் கிடைக்கவில்லை என்றால் ஐபிரேம் அல்லது வீடியோ டேக்கைச் சோதித்தல்
        if (!liveStreamUrl) {
            liveStreamUrl = await page.evaluate(() => {
                const iframe = document.querySelector('iframe');
                const video = document.querySelector('video');
                const source = document.querySelector('source');
                if (iframe && iframe.src) return iframe.src;
                if (video && video.src) return video.src;
                if (source && source.src) return source.src;
                return '';
            });
        }

        await browser.close();
        
        if (liveStreamUrl) {
            res.json({ success: true, url: liveStreamUrl });
        } else {
            res.status(500).json({ success: false, error: "Stream URL not found" });
        }
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
