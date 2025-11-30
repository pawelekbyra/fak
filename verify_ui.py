
import time
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 414, 'height': 896}, # iPhone 11 Pro Max size
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        try:
            # 1. Navigate to the app
            print("Navigating to http://127.0.0.1:3000")
            page.goto("http://127.0.0.1:3000", timeout=60000)

            # Wait for content to load
            print("Waiting for page load...")
            time.sleep(5)

            # 2. Handle Language Preloader (if present)
            # Memory says: "The application shows a full-screen language selection overlay... Test scripts must first select a language"
            # It also says we should clear localStorage, but new context starts clean.

            try:
                print("Checking for language selector...")
                pl_button = page.get_by_text("Polski")
                if pl_button.is_visible(timeout=5000):
                    print("Clicking Polski...")
                    pl_button.click(force=True)
                    time.sleep(2)
            except Exception as e:
                print(f"Preloader handling note: {e}")

            # 3. Verify TopBar Icons (Task 1)
            # Capture screenshot of top area
            print("Taking TopBar screenshot...")
            page.screenshot(path="verification/topbar.png", clip={'x': 0, 'y': 0, 'width': 414, 'height': 100})

            # 4. Verify Video Footer (Task 4)
            # Capture screenshot of bottom area
            print("Taking Footer screenshot...")
            page.screenshot(path="verification/footer.png", clip={'x': 0, 'y': 700, 'width': 414, 'height': 196})

            # 5. Verify Badges (Task 3a)
            # We need to find a comment or simulate one.
            # Navigating to a slide that has comments is hard without knowing DB state.
            # But we can try to click the comments button on the sidebar if visible.

            # Memory says: "Sidebar... contains a comments button identifiable by `data-testid='comments-button'`"
            try:
                print("Looking for comments button...")
                # We might need to wait for a slide to load.
                page.wait_for_selector('[data-testid="comments-button"]', timeout=10000)
                page.click('[data-testid="comments-button"]')
                time.sleep(2)

                print("Taking Comments Modal screenshot...")
                page.screenshot(path="verification/comments.png")
            except Exception as e:
                print(f"Could not open comments: {e}")

            print("Verification script finished.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ui()
