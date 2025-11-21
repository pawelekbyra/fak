
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Log console messages
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"BROWSER ERROR: {exc}"))

        print("Navigating to home...")
        try:
            page.goto("http://localhost:3001", timeout=60000)
        except Exception as e:
            print(f"Error navigating: {e}")
            return

        # Wait for language selection (based on memory)
        print("Waiting for language selection...")
        try:
            # Increased timeout
            page.wait_for_selector("text=Polski", timeout=30000)
            page.click("text=Polski")
        except Exception as e:
            print(f"Language selection not found or timed out ({e}), proceeding...")
            page.screenshot(path="verification_lang_error.png")

        # Wait for slides
        print("Waiting for slides...")
        try:
            # Check for the new structure
            # Container with snap-y
            # Slide items
            page.wait_for_selector(".slide-item", timeout=60000)

            # Verify container classes
            container = page.locator("div.overflow-y-scroll.snap-y.snap-mandatory")
            if container.count() > 0:
                print("Container with scroll snap found.")
            else:
                print("Container with scroll snap NOT found.")

            # Take initial screenshot
            page.screenshot(path="verification_initial.png")
            print("Initial screenshot taken.")

            # Scroll down
            print("Scrolling down...")
            # Scroll by viewport height
            page.evaluate("document.querySelector('div.overflow-y-scroll').scrollBy(0, window.innerHeight)")

            time.sleep(5) # Wait for snap and potential load

            page.screenshot(path="verification_scrolled.png")
            print("Scrolled screenshot taken.")

        except Exception as e:
            print(f"Error waiting for content: {e}")
            page.screenshot(path="verification_error.png")

        browser.close()

if __name__ == "__main__":
    run()
