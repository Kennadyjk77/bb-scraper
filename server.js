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
        
        let streamUrl = '';
        
        // நெட்வொர்க்கில் ரகசியமாகச் செல்லும் .m3u8 அல்லது ஸ்ட்ரீம் லிங்க்கைப் பிடித்தல்
        page.on('request', (request) => {
            const url = request.url();
            if ((url.includes('.m3u8') || url.includes('playlist') || url.includes('manifest')) && !url.includes('tamiltvserial.com')) {
                streamUrl = url;
            }
        });

        await page.goto('https://stream2.zoloj.com/stream/tamil.m3u8?sid=9de85460e2cfab3cdb4b9fec29911afe57ca5a7191b2f1b16b52d059974c894c', { waitUntil: 'networkidle2', timeout: 60000 });
        
        // தளம் முழுமையாக லோட் ஆகி ஐபிரேம் வெளிவர 6 விநாடிகள் காத்திருத்தல்
        await new Promise(resolve => setTimeout(resolve, 6000));

        // நெட்வொர்க்கில் கிடைக்கவில்லை என்றால் தளத்தில் உள்ள ஐபிரேம் சோர்ஸைத் தேடுதல்
        if (!streamUrl) {
            streamUrl = await page.evaluate(() => {
                const iframes = Array.from(document.querySelectorAll('iframe'));
                for (let iframe of iframes) {
                    if (iframe.src && (iframe.src.includes('player') || iframe.src.includes('embed') || iframe.src.includes('zoloj'))) {
                        return iframe.src;
                    }
                }
                return iframes.length > 0 ? iframes[0].src : 'https://www.tamiltvserial.com/all-bigg-boss-live-24-7/';
            });
        }

        await browser.close();
        res.json({ success: true, url: streamUrl });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
