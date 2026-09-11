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
        
        let foundStreamUrl = '';

        // நெட்வொர்க்கில் ரகசியமாக ஓடும் .m3u8 அல்லது பிளேலிஸ்ட் லிங்க்கை உறுதியாகப் பிடித்தல்
        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('.m3u8') || url.includes('playlist') || url.includes('manifest')) {
                foundStreamUrl = url;
            }
        });

        // நேரடியாக சோலார் பிளேயர் பக்கத்திற்குச் செல்லுதல்
        await page.goto('https://stream2.zoloj.com/player?lang=tamil', { waitUntil: 'networkidle2', timeout: 60000 });
        
        // பிளேயர் லோட் ஆக சிறிது நேரம் காத்திருத்தல்
        await new Promise(resolve => setTimeout(resolve, 5000));

        // பிளேயர் மீது ஆட்டோமேட்டிக் கிளிக் செய்து ஸ்ட்ரீம் ரெக்வெஸ்ட்டைத் தூண்டுதல்
        try {
            await page.mouse.click(500, 300);
        } catch (e) {}

        await new Promise(resolve => setTimeout(resolve, 5000));

        // நெட்வொர்க்கில் கிடைக்கவில்லை என்றால் பேஜில் உள்ள வீடியோ சோர்ஸைத் தேடுதல்
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
