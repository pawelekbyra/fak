
import { chromium, Browser, Page, Route } from 'playwright';

async function verifyEmulatorFrame() {
  const browser: Browser = await chromium.launch({ headless: true });
  // Desktop Viewport
  const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Set timeout
  page.setDefaultTimeout(30000);

  // Mock API to avoid errors
  await page.route('**/api/slides*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        pages: [{ data: [], nextCursor: null }]
      }),
    });
  });

  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3000');

  // Verify Body Background
  const bodyBg = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  console.log('Body Background (Desktop):', bodyBg);
  // #f3f4f6 is rgb(243, 244, 246)
  if (bodyBg === 'rgb(243, 244, 246)') {
      console.log('✅ Body background is correct (light gray).');
  } else {
      console.error('❌ Body background is incorrect.');
  }

  // Verify AppLayout (Emulator Frame)
  // Look for the element with the specific border style or ID if I added one.
  // I added id="app-layout" to AppLayout.tsx
  const appLayout = page.locator('#app-layout');
  await appLayout.waitFor();

  const layoutBox = await appLayout.boundingBox();
  console.log('AppLayout Box:', layoutBox);

  if (layoutBox && layoutBox.width > 300 && layoutBox.width < 500) {
      console.log('✅ AppLayout width looks like a phone emulator.');
  } else {
      console.error('❌ AppLayout width is suspicious:', layoutBox?.width);
  }

  // Verify TopBar is contained
  // TopBar should be inside AppLayout.
  // Its position should be relative to AppLayout, not the viewport.
  const topBar = page.locator('text=Nie masz psychy').first(); // or just use a known selector from TopBar
  const topBarBox = await topBar.boundingBox();

  // TopBar top should be close to AppLayout top (accounting for border)
  // AppLayout has border-8 (8px).
  // If topBar is absolute top-0, it should be at appLayout.y + 8 (if border is outside) or just 0 relative to content box.
  // Playwright boundingBox is viewport relative.
  if (layoutBox && topBarBox) {
      console.log(`Layout Y: ${layoutBox.y}, TopBar Y: ${topBarBox.y}`);
      if (Math.abs(topBarBox.y - layoutBox.y) < 20) {
          console.log('✅ TopBar is aligned with AppLayout top.');
      } else {
          console.error('❌ TopBar seems misaligned.');
      }

      // Check width
      if (Math.abs(topBarBox.width - layoutBox.width) < 20) { // accounting for border/scrollbar
           console.log('✅ TopBar width matches AppLayout.');
      } else {
           console.error('❌ TopBar width mismatch.');
      }
  }

  await page.screenshot({ path: 'verification/emulator_desktop.png' });
  console.log('Screenshot saved to verification/emulator_desktop.png');

  await browser.close();
}

verifyEmulatorFrame().catch(async (err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
