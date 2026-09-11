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

        // புதிய டேப் (Popup) ஓபன் ஆகும்போதே அதன் URL-ஐப் பிடித்தல்
        browser.on('targetcreated', async (target) => {
            const targetUrl = target.url();
            if (targetUrl.includes('zoloj.com') || targetUrl.includes('player') || targetUrl.includes('embed')) {
                finalStreamUrl = targetUrl;
            }
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('.m3u8')) {
                finalStreamUrl = url;
            }
        });

        // தளத்திற்குச் செல்லுதல்
        await page.goto('https://www.tamiltvserial.com/all-bigg-boss-live-24-7/', { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 4000));

        // "Bigg Boss Tamil" என்ற டெக்ஸ்ட் உள்ள லிங்க் அல்லது பட்டனைத் தேடிக் கிளிக் செய்தல்
        try {
            await page.evaluate(() => {
                const elements = document.querySelectorAll('a, button, div, span');
                for (let el of elements) {
                    if (el.innerText && el.innerText.includes('Bigg Boss Tamil')) {
                        el.click();
                        break;
                    }
                }
            });
        } catch (e) {}

        // புதிய டேப் ஓபன் ஆகி ஸ்ட்ரீம் லோட் ஆக 6 விநாடிகள் காத்திருத்தல்
        await new Promise(resolve => setTimeout(resolve, 6000));

        // அனைத்து ஓபன் ஆன டேப்களையும் சரிபார்த்து ஸ்ட்ரீம் லிங்கை எடுத்தல்
        const pages = await browser.pages();
        for (let p of pages) {
            const pUrl = p.url();
            if (pUrl.includes('zoloj.com') || pUrl.includes('player')) {
                finalStreamUrl = pUrl;
                break;
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
