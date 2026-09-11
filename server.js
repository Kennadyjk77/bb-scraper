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
        
        let finalStreamUrl = '';

        // புதிய டேப் (New Tab/Popup) ஓபன் ஆகும்போதே அதன் URL-ஐப் பிடித்தல்
        browser.on('targetcreated', async (target) => {
            const targetUrl = target.url();
            if (targetUrl.includes('zoloj.com') || targetUrl.includes('player') || targetUrl.includes('embed')) {
                finalStreamUrl = targetUrl;
            }
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // நெட்வொர்க்கில் செல்லும் .m3u8 லிங்க்கையும் கண்காணித்தல்
        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('.m3u8')) {
                finalStreamUrl = url;
            }
        });

        await page.goto('https://www.tamiltvserial.com/all-bigg-boss-live-24-7/', { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 4000));

        // பிளேயர் அல்லது லிங்க்கை க்ளிக் செய்து புதிய டேப் ஓபன் ஆவதைத் தூண்டுதல்
        try {
            await page.evaluate(() => {
                const elements = document.querySelectorAll('a, iframe, div, button');
                for (let el of elements) {
                    if (el.innerHTML.includes('Live') || el.className.includes('play') || el.tagName === 'IFRAME') {
                        el.click();
                        break;
                    }
                }
            });
        } catch (e) {}

        // புதிய டேப் ஓபன் ஆகி டேட்டா வர 6 விநாடிகள் காத்திருத்தல்
        await new Promise(resolve => setTimeout(resolve, 6000));

        // புதிய டேப் எதுவும் கிடைக்கவில்லை என்றால் மெயின் பேஜ் ஐபிரேமை எடுத்தல்
        if (!finalStreamUrl) {
            const pages = await browser.pages();
            for (let p of pages) {
                const pUrl = p.url();
                if (pUrl.includes('zoloj.com')) {
                    finalStreamUrl = pUrl;
                    break;
                }
            }
        }

        if (!finalStreamUrl) {
            finalStreamUrl = await page.evaluate(() => {
                const iframe = document.querySelector('iframe');
                return iframe ? iframe.src : 'https://www.tamiltvserial.com/all-bigg-boss-live-24-7/';
            });
        }

        await browser.close();
        res.json({ success: true, url: finalStreamUrl });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
