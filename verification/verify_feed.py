from playwright.sync_api import sync_playwright, expect

def verify_feed():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 375, 'height': 667}, # Mobile viewport
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
        )
        page = context.new_page()

        print("Navigating to homepage...")
        page.goto("http://localhost:3000")

        # Handle Language Selection if present
        try:
            print("Waiting for language selection...")
            # Try to find the Polish button. Adjust selector based on inspection if needed.
            # Usually contains text "Polski"
            lang_btn = page.get_by_role("button", name="Polski")
            if lang_btn.is_visible(timeout=5000):
                lang_btn.click()
                print("Clicked Polish language button.")
            else:
                print("Language button not found or not visible, checking if feed loaded directly.")
        except Exception as e:
            print(f"Language selection skipped: {e}")

        # Wait for feed items
        print("Waiting for feed items...")
        try:
            page.wait_for_selector(".slide-item", timeout=15000)
            print("Feed items loaded.")
        except Exception as e:
            print("Timed out waiting for .slide-item")
            page.screenshot(path="verification/error_load.png")
            browser.close()
            raise e

        # Initial Screenshot
        page.screenshot(path="verification/feed_initial.png")

        # Simulate Scroll
        print("Simulating scroll...")
        # Scroll down by one viewport height
        page.mouse.wheel(0, 667)

        # Wait for scroll snap to settle and potential video load
        page.wait_for_timeout(2000)

        # Take screenshot
        page.screenshot(path="verification/feed_scrolled.png")
        print("Screenshot taken: verification/feed_scrolled.png")

        browser.close()

if __name__ == "__main__":
    verify_feed()
