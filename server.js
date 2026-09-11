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
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage', 
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ]
        });
        
        const page = await browser.newPage();
        
        // ஆட்டோமேஷன் கண்டறிதலைத் தவிர்க்க யூசர் ஏஜென்ட் மற்றும் எக்ஸ்ட்ரா ஹெடர்களை மாற்றுதல்
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
        });

        let foundStreamUrl = '';

        // நெட்வொர்க்கில் செல்லும் அனைத்து ரெக்வெஸ்ட் மற்றும் ரெஸ்பான்ஸ்களைக் கண்காணித்தல் (.m3u8 அல்லது ஜேசன் காஃபிக்)
        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('.m3u8') || url.includes('playlist') || url.includes('manifest') || url.includes('chunk')) {
                if (!foundStreamUrl) foundStreamUrl = url;
            }
        });

        // ரெஸ்பான்ஸ் பாடியைக் கண்காணித்து பிளேயர் காஃபிக்கில் உள்ள .m3u8 ஐத் தேடுதல்
        page.on('response', async (response) => {
            try {
                const url = response.url();
                if (url.includes('.json') || url.includes('config') || url.includes('player')) {
                    const text = await response.text();
                    if (text.includes('.m3u8')) {
                        const match = text.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
                        if (match) {
                            foundStreamUrl = match[0];
                        }
                    }
                }
            } catch (e) {}
        });

        await page.goto('https://stream2.zoloj.com/player?lang=tamil', { waitUntil: 'networkidle2', timeout: 60000 });
        
        // பிளேயர் லோட் ஆகி ரகசிய ஸ்கிரிப்டுகள் ஓட 8 விநாடிகள் காத்திருத்தல்
        await new Promise(resolve => setTimeout(resolve, 8000));

        // பிளேயர் மீது கிளிக் செய்து வீடியோவை ஆன் செய்தல்
        try {
            await page.mouse.click(640, 360);
        } catch (e) {}

        await new Promise(resolve => setTimeout(resolve, 6000));

        // இறுதியாக DOM-ஐச் சோதித்து வீடியோ சோர்ஸைத் தேடுதல்
        if (!foundStreamUrl) {
            foundStreamUrl = await page.evaluate(() => {
                const video = document.querySelector('video');
                const source = document.querySelector('source');
                const iframe = document.querySelector('iframe');
                
                if (video && video.src) return video.src;
                if (source && source.src) return source.src;
                if (iframe && iframe.src) return iframe.src;
                return '';
            });
        }

        await browser.close();

        if (foundStreamUrl) {
            res.json({ success: true, url: foundStreamUrl });
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
