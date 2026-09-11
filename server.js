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
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        let targetUrl = '';
        
        // நெட்வொர்க்கில் ரகசியமாகச் செல்லும் .m3u8 அல்லது ஐபிரேம் லிங்கைப் பிடித்தல்
        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('.m3u8') || url.includes('playlist')) {
                targetUrl = url;
            }
        });

        // தளத்திற்குச் செல்லுதல்
        await page.goto('https://www.tamiltvserial.com/all-bigg-boss-live-24-7/', { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 4000));

        // புதிய டேப் (New Tab) ஓபன் ஆவதை ஹேண்டில் செய்ய பிரவுசரின் அனைத்துப் பக்கங்களையும் கண்காணித்தல்
        const browserContext = browser.defaultBrowserContext();
        
        // லைவ் பட்டனை அல்லது பிளேயரை க்ளிக் செய்தல் (புதிய டேப் ஓபன் ஆகும் இடத்தை ட்ரிகர் செய்ய)
        try {
            // தளத்தில் உள்ள லைவ் பிளே பட்டன் அல்லது ஐபிரேமைத் தேடி க்ளிக் செய்தல்
            await page.evaluate(() => {
                const playBtn = document.querySelector('.play-button, iframe, .video-container, a[href*="zoloj"]');
                if (playBtn) playBtn.click();
            });
        } catch (e) {}

        await new Promise(resolve => setTimeout(resolve, 5000));

        // அனைத்து ஓபன் ஆன டேப்களையும் சரிபார்த்து Zoloj அல்லது பிளேயர் லிங்க்கை எடுத்தல்
        const pages = await browser.pages();
        for (let p of pages) {
            const pUrl = p.url();
            if (pUrl.includes('zoloj.com') || pUrl.includes('player') || pUrl.includes('embed')) {
                targetUrl = pUrl;
                break;
            }
        }

        // ஒருவேளை நெட்வொர்க்கிலோ அல்லது புதிய டேப்பிலோ கிடைக்கவில்லை என்றால் மெயின் பேஜ் ஐபிரேமைத் தேடுதல்
        if (!targetUrl) {
            targetUrl = await page.evaluate(() => {
                const iframe = document.querySelector('iframe');
                return iframe ? iframe.src : 'https://www.tamiltvserial.com/all-bigg-boss-live-24-7/';
            });
        }

        await browser.close();
        res.json({ success: true, url: targetUrl });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
