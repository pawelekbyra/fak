
import { chromium, Browser, Page, Route, Request } from 'playwright';

async function verifyOverlays() {
  const browser: Browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newPage();

  // Set timeout to 60s
  page.setDefaultTimeout(60000);

  // Mock the slides endpoint to return a SECRET_PATRON slide
  await page.route('**/api/slides*', async (route: Route) => {
    const mockSlide = {
      id: 'test-slide-secret',
      type: 'video',
      accessLevel: 'SECRET_PATRON', // <--- Key for test
      userId: 'user-1',
      username: 'Test Author',
      avatar: 'https://placehold.co/40',
      initialLikes: 10,
      initialComments: 5,
      isLiked: false,
      data: {
        title: 'Secret Video',
        description: 'This is a secret video',
        videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
        thumbnailUrl: 'https://placehold.co/600x400',
      },
    };

    // Return mocked response
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        pages: [
            {
                data: [mockSlide],
                nextCursor: null
            }
        ]
      }),
    });
  });

  // Mock comments to avoid errors
  await page.route('**/api/comments*', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ success: true, comments: [], nextCursor: null }),
    });
  });

  // Mock author profile
  await page.route('**/api/author/*', async (route) => {
      await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 'user-1', username: 'Test Author', avatar: 'https://placehold.co/40', bio: 'Bio', role: 'author', slides: [] })
      });
  });


  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3000');

  // Handle Language Modal if present
  try {
      const langButton = page.getByText('Polski', { exact: true });
      if (await langButton.isVisible({ timeout: 5000 })) {
          await langButton.click();
          console.log('Language selected.');
      }
  } catch (e) {
      console.log('Language modal not found or skipped.');
  }

  // Handle Preloader/PWA install prompt (z-10000 overlay)
  // It might be "Install App" or just preloader
  // We wait for it to detach
  try {
      // Memory says: explicit wait for z-[10000] loading overlay to disappear
      // Or we can try to click "Maybe later" if it's a PWA prompt
      // Let's wait for the slide content to be visible
      await page.waitForSelector('text=Top Secret', { timeout: 30000 });
  } catch (e) {
      console.log('Timeout waiting for "Top Secret" text. Preloader might be stuck.');
      // Force remove preloader if needed?
      // await page.evaluate(() => document.querySelector('.z-[10000]')?.remove());
  }

  console.log('Checking for "Top Secret" overlay...');
  const overlayText = page.getByText('Top Secret');
  await overlayText.waitFor();

  if (await overlayText.isVisible()) {
      console.log('✅ "Top Secret" text is visible.');
  } else {
      console.error('❌ "Top Secret" text is NOT visible.');
  }

  // Verify Sidebar visibility
  console.log('Checking for Sidebar elements...');
  const likeButton = page.locator('button[data-action="toggle-like"]');
  const shareButton = page.locator('button[data-action="share"]');
  const tipButton = page.locator('button[data-action="show-tip-jar"]');

  if (await likeButton.isVisible()) console.log('✅ Like button is visible.');
  else console.error('❌ Like button is NOT visible.');

  if (await shareButton.isVisible()) console.log('✅ Share button is visible.');
  else console.error('❌ Share button is NOT visible.');

  if (await tipButton.isVisible()) console.log('✅ Tip button is visible.');
  else console.error('❌ Tip button is NOT visible.');

  // Check layering via evaluation (is Sidebar clickable?)
  // We can try to click the like button. It should NOT be intercepted by the overlay.
  // Although, if not logged in, it opens login modal.
  // If overlay was on top, the click would hit the overlay (which does nothing or opens login).
  // But SecretOverlay has a button inside it too "Zaloguj się".
  // The Sidebar is to the right. The overlay is full screen.
  // If Sidebar is z-20 and Overlay is z-10, Sidebar should receive the click.

  // Let's verify z-indices computed style
  const sidebarZIndex = await likeButton.evaluate((el) => {
      return window.getComputedStyle(el.closest('aside')!).zIndex;
  });
  console.log(`Sidebar z-index: ${sidebarZIndex}`);

  // Take screenshot
  await page.screenshot({ path: 'verification/overlay_verification.png' });
  console.log('Screenshot saved to verification/overlay_verification.png');

  await browser.close();
}

verifyOverlays().catch(async (err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
