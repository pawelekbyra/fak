
import os
import time
from playwright.sync_api import sync_playwright

def verify_ui_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant permissions for notifications to test the TopBar logic if needed,
        # though we are mostly checking visual spacing.
        context = browser.new_context(
            permissions=['notifications'],
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()

        # 1. Navigate to the app
        print("Navigating to app...")
        try:
            page.goto("http://127.0.0.1:3000", timeout=60000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            return

        # 2. Handle Preloader (Language Selection)
        # Since we are essentially a new user in this context, the preloader will show.
        # We need to click a language to proceed.
        print("Handling preloader...")
        try:
            pl_button = page.get_by_text("Polski")
            pl_button.wait_for(state="visible", timeout=10000)
            pl_button.click(force=True)
            # Wait for preloader to disappear
            page.wait_for_selector(".absolute.inset-0.bg-black", state="hidden", timeout=5000)
            print("Preloader handled.")
        except Exception as e:
            print(f"Preloader handling issue (might be skipped if logic worked?): {e}")

        # 3. Wait for TopBar to be visible
        # TopBar usually has the menu icon or "Ting Tong" text (or "Too scared to log in")
        page.wait_for_timeout(2000)

        # 4. Take Screenshot of TopBar (Mobile View) to verify padding
        print("Taking screenshots...")
        page.set_viewport_size({"width": 375, "height": 667})
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/topbar_mobile_padding.png")

        # 5. Take Screenshot of Desktop View
        page.set_viewport_size({"width": 1280, 'height': 800})
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/topbar_desktop_padding.png")

        browser.close()

if __name__ == "__main__":
    verify_ui_changes()
