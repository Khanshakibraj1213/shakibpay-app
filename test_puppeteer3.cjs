const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const result = await page.evaluate(() => {
    try {
      const res = new Response('{}');
      return res.status;
    } catch (e) {
      return e.message;
    }
  });
  console.log('Result:', result);
  
  await browser.close();
})();
