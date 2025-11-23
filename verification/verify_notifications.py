
import time
from playwright.sync_api import sync_playwright

def verify_notifications():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 414, 'height': 896}, # Mobile viewport
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        try:
            print("Navigating to localhost:3000...")
            page.goto("http://localhost:3000")

            # 1. Handle Language Selection if present
            try:
                print("Waiting for language selection...")
                # Wait up to 5 seconds for language button
                lang_btn = page.wait_for_selector('button:has-text("Polski")', timeout=5000)
                if lang_btn:
                    print("Clicking Polish language...")
                    lang_btn.click()
                    time.sleep(2)
            except Exception as e:
                print(f"Language selection skipped or not found: {e}")

            # 2. Click the Notification Bell
            print("Looking for bell button...")

            # Use aria-label="Powiadomienia" which I saw in the HTML dump!
            # <button ... aria-label="Powiadomienia" ...>

            bell_btn = page.locator('button[aria-label="Powiadomienia"]')

            # Wait for it to be visible/enabled
            bell_btn.wait_for(state='visible', timeout=10000)

            print("Clicking bell button...")
            bell_btn.click()

            # 3. Wait for the Notification Popup to appear
            print("Waiting for notification popup header...")
            # The popup header likely contains "Powiadomienia"
            # It might take a moment to fetch data and render

            page.wait_for_selector('h3:has-text("Powiadomienia")', timeout=5000)

            print("Waiting for mock content...")
            # We expect "Witaj w Ting Tong!" from our mock data
            # Or part of it.

            # Wait for list item
            page.wait_for_selector('li', timeout=5000)

            # Take screenshot of the result
            page.screenshot(path="verification/verification.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_notifications()
