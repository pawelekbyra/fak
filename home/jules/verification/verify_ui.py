import time
from playwright.sync_api import sync_playwright, expect

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 375, "height": 812}, # Mobile view
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        # Wait for server to start
        time.sleep(5)

        try:
            # 1. Check Unauthenticated State
            print("Navigating to home...")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            print("Checking unauthenticated title...")
            # Check for the specific text "Nie masz psychy się zalogować"
            # Using a broad text search first to debug if it's not found
            content = page.content()
            if "Nie masz psychy się zalogować" not in content:
                print("WARNING: Title text not found in content!")

            try:
                expect(page.get_by_text("Nie masz psychy się zalogować")).to_be_visible(timeout=5000)
                print("Title confirmed.")
            except:
                print("Title element verification failed.")

            page.screenshot(path="/home/jules/verification/1_unauth_home.png")

            # 2. Check Login Modal Animation (Visual check via screenshot sequence difficult in headless, taking one)
            print("Opening login panel...")
            page.get_by_text("Nie masz psychy się zalogować").click()
            time.sleep(0.5) # Wait for animation
            page.screenshot(path="/home/jules/verification/2_login_modal.png")

            # Close login modal
            page.mouse.click(10, 200) # Click outside
            time.sleep(0.5)

            # 3. Log in (using a test account if we can, or just simulating UI if backend mocking is hard)
            # Since we updated server actions, real login is preferred.
            # Let's try to create a user first or use a seeded one if we knew credentials.
            # I don't have credentials. I will skip full login verification flow and focus on visual elements I can control
            # or try to register if there is a register flow?
            # The Login form has "Register".

            # Let's Mock the user state by manipulating cookies if possible, or just check the code we wrote.
            # Actually, I can't easily bypass auth without a valid token.
            # I will assume the unauthenticated changes are verified.
            # For authenticated changes (menu "bricks"), I can't verify without login.

            # Let's try to register a temp user.
            # But the login form might not have register visible or it might be complex.
            # Let's check the login form content from the previous screenshot.

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_changes()
