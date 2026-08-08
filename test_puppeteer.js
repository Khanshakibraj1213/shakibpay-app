const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('https://ais-dev-gmqnsagfvjepakdtirrc7j-945338365815.europe-west2.run.app');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
