from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a desktop viewport
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to home page...")
        # Assuming the dev server is running on localhost:3000
        # Retry logic or wait might be needed if server is slow to start
        try:
            page.goto("http://127.0.0.1:3000")
        except Exception as e:
            print(f"Failed to load page: {e}")
            return

        # Handle Language Preloader if present
        print("Checking for language preloader...")
        try:
            # Wait for a bit to see if preloader appears
            page.wait_for_timeout(2000)
            # Try to click Polish language if visible
            pl_button = page.get_by_text("Polski")
            if pl_button.is_visible():
                print("Selecting language...")
                pl_button.click(force=True)
                # Wait for preloader to disappear
                page.wait_for_selector(".preloader", state="hidden", timeout=5000)
        except Exception as e:
            print(f"Preloader handling note: {e}")

        # 1. Verify Secret Overlay Text (Task 1)
        # We need to find a locked slide. If none, we can't verify easily without mocking.
        # But we can check if we can trigger the login modal to verify Task 10b.

        # 2. Verify Login Modal Spacing (Task 10b)
        print("Opening Login Modal...")
        # Trigger login modal via TopBar
        # Check if 'Nie masz psychy się zalogować' is visible (logged out state)
        if page.get_by_text("Nie masz psychy się zalogować").is_visible():
            page.get_by_text("Nie masz psychy się zalogować").click()
            page.wait_for_timeout(1000) # Wait for animation
            page.screenshot(path="verification/login_modal.png")
            print("Captured login_modal.png")

        # 3. Verify Sidebar Share Icon (Task 10a)
        # Look for the share button in sidebar
        print("Checking Sidebar Share Icon...")
        # We can't easily assert the icon shape in a screenshot script without visual regression tools,
        # but taking a screenshot of the sidebar helps.
        page.screenshot(path="verification/sidebar.png")
        print("Captured sidebar.png")

        # 4. Verify Author Profile Modal (Task 4, 6, 7)
        # Open Author Profile. Need to click on an avatar in the feed.
        print("Opening Author Profile...")
        # Find an avatar in the slide
        avatar = page.locator("img[alt='User']").first
        if avatar.is_visible():
            avatar.click()
            page.wait_for_timeout(1000) # Wait for animation
            page.screenshot(path="verification/author_profile.png")
            print("Captured author_profile.png")

        # 5. Verify Tipping Modal (Task 3)
        # If we are in Author Profile, we can click "Zostań Patronem"
        print("Opening Tipping Modal...")
        patron_btn = page.get_by_text("Zostań Patronem").first
        if patron_btn.is_visible():
            patron_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/tipping_modal.png")
            print("Captured tipping_modal.png")

        browser.close()

if __name__ == "__main__":
    verify_changes()
