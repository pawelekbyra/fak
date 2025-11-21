import time
from playwright.sync_api import sync_playwright, expect

def verify_feed():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844}, # iPhone 12 Pro viewport
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        print("Navigating to home...")
        page.goto("http://localhost:3000", timeout=60000)

        # Handle Language Selection Modal
        print("Checking for language selection...")

        try:
            # Force wait for the egg/logo first to ensure page is active
            page.wait_for_selector("img[alt='Ting Tong Logo']", timeout=10000)
            print("Preloader visible.")

            # Wait for button
            lang_btn = page.locator("button").filter(has_text="Polski")
            lang_btn.wait_for(state="visible", timeout=15000)
            lang_btn.click()
            print("Language selected.")

            # Wait for Preloader to disappear
            # It has exit animation.
            page.locator("img[alt='Ting Tong Logo']").wait_for(state="hidden", timeout=15000)
            print("Preloader hidden.")

        except Exception as e:
            print(f"Preloader interaction failed: {e}")
            page.screenshot(path="/home/jules/verification/preloader_fail.png")

        # Wait for feed to load
        print("Waiting for feed items...")
        try:
            # Wait for Slide content.
            # Sidebar has icons.
            page.wait_for_selector("svg.lucide-heart", timeout=30000)
            print("Feed content loaded (Heart icon found).")

        except Exception as e:
            print(f"Error waiting for slide content: {e}")
            page.screenshot(path="/home/jules/verification/load_failure.png")
            browser.close()
            return

        # Take screenshot of initial state
        page.screenshot(path="/home/jules/verification/feed_initial.png")
        print("Initial screenshot saved.")

        # Simulate scroll
        print("Simulating scroll down...")
        # We can use mouse wheel or touch simulation
        scroller = page.locator(".snap-y").first

        if scroller.count() > 0:
            # Scroll by viewport height
            scroller.evaluate("element => element.scrollTop += window.innerHeight")
            time.sleep(2) # Wait for snap and render
            page.screenshot(path="/home/jules/verification/feed_scrolled.png")
            print("Scrolled screenshot saved.")

             # Scroll more to trigger infinite loop
            print("Scrolling multiple times to test infinite loop...")
            for i in range(5):
                scroller.evaluate("element => element.scrollTop += window.innerHeight")
                time.sleep(1)

            page.screenshot(path="/home/jules/verification/feed_infinite.png")
            print("Infinite loop screenshot saved.")

        else:
             print("Scroller not found!")
             page.screenshot(path="/home/jules/verification/no_scroller.png")

        browser.close()

if __name__ == "__main__":
    verify_feed()
