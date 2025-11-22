import os
from playwright.sync_api import sync_playwright, expect

def verify_modals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        try:
            page.goto("http://localhost:3000", timeout=60000)

            # Wait for initial load
            try:
                lang_button = page.get_by_role("button", name="Polski")
                if lang_button.is_visible(timeout=5000):
                    lang_button.click()
            except:
                pass

            page.wait_for_load_state("networkidle", timeout=10000)

            # Screenshot main feed
            page.screenshot(path="verification/feed.png")
            print("Screenshot saved to verification/feed.png")

        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_modals()
