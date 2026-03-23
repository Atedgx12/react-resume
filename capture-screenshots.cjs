const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const sites = [
  { id: 'victorlawrence', url: 'https://victorlawrencellc.com' },
  { id: 'pasbotanicals', url: 'https://www.pasbotanicals.com' },
  { id: 'villagesoc', url: 'https://thevillagesoc.com' },
  { id: 'nomadictechco', url: 'https://nomadictechco.com' },
  { id: 'blainlaw', url: 'https://theblainlawfirm.com' },
  { id: 'nexxusorg', url: 'https://nexxuslevelprimarycare.org' },
  { id: 'nexxusnet', url: 'https://nexxuslevelprimarycare.net' },
  { id: 'aiiai-site', url: 'https://aiiai.org' },
  { id: 'entangled', url: 'https://entangled.love' },
  { id: 'getlocked', url: 'https://getlocked.net' },
];

const outDir = path.join(__dirname, 'src', 'assets', 'images', 'screenshots');

async function run() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
  });

  for (const site of sites) {
    const page = await browser.newPage();
    const filePath = path.join(outDir, `${site.id}.png`);
    try {
      console.log(`Capturing ${site.url} ...`);
      await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000)); // let animations settle
      await page.screenshot({ path: filePath, type: 'png' });
      console.log(`  Saved: ${filePath}`);
    } catch (err) {
      console.error(`  FAILED ${site.url}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('Done!');
}

run();
