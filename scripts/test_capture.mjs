import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Find chrome path
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Testing Chrome launch with WebGL...');
try {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1200,900'
    ]
  });
  console.log('Browser launched successfully!');
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto('https://epic-hubble.vercel.app', { waitUntil: 'networkidle0', timeout: 30000 });
  console.log('Page loaded!');
  await new Promise(r => setTimeout(r, 2000));
  const screenshot = await page.screenshot();
  console.log(`Screenshot taken! Size: ${screenshot.length} bytes`);
  await browser.close();
  console.log('Test successful!');
} catch (err) {
  console.error('Test error:', err);
}
