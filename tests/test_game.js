const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Navigate to the local server
  await page.goto('http://localhost:8080');
  
  // Wait for the home screen to render
  await page.waitForSelector('.play-btn');
  
  // Click play
  await page.click('.play-btn');
  
  // Wait for game screen
  await page.waitForSelector('#screen-game', { visible: true });
  
  // Click bomb button
  await page.click('#btn-bomb');
  
  // Take screenshot after clicking bomb button
  await page.screenshot({ path: 'bomb_clicked.png' });
  
  // Click the center of the canvas (grid)
  const canvas = await page.$('#gameCanvas');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  
  // Wait a little for animation
  await new Promise(r => setTimeout(r, 500));
  
  // Take final screenshot
  await page.screenshot({ path: 'after_bomb_grid.png' });
  
  await browser.close();
  console.log('Test completed');
})();
