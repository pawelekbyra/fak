
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_ui_changes(page: Page):
    # 1. Go to homepage
    page.goto("http://localhost:3000")

    # Handle Language Selection if present
    try:
        page.wait_for_selector("text=Polski", timeout=5000)
        page.click("text=Polski")
        time.sleep(1)
    except:
        print("Language selection not found or skipped.")

    page.wait_for_load_state("networkidle")

    # 2. Verify "Ting Tong" header (Logged Out)
    # Just take a screenshot
    page.screenshot(path="/home/jules/verification/homepage_logged_out.png")
    print("Screenshot of logged out homepage saved.")

    # 3. Login to verify Menu
    # Open Login Panel - click the header text "Ting Tong" (which replaced "Nie masz psychy...")
    try:
        page.click("text=Ting Tong")
        time.sleep(0.5)

        # Fill Login Form
        page.fill('input[placeholder="Login"]', "admin")
        page.fill('input[placeholder="Hasło"]', "admin")
        page.click("text=Wejdź")

        # Wait for login (reload or UI update)
        time.sleep(3)

        page.screenshot(path="/home/jules/verification/homepage_logged_in.png")
        print("Screenshot of logged in homepage saved.")

        # Open Menu
        # Find the menu icon button. It has aria-label=t('menuAriaLabel') -> 'Menu'
        menu_btn = page.locator('button[aria-label="Menu"]').first
        if menu_btn.is_visible():
            menu_btn.click()
            time.sleep(1)
            page.screenshot(path="/home/jules/verification/windows_menu.png")
            print("Screenshot of Windows-style menu saved.")

            # Close menu by clicking outside
            page.mouse.click(0, 0)
        else:
            print("Menu button not found.")
    except Exception as e:
        print(f"Login or Menu verification failed: {e}")

    # 4. Verify Comments Modal
    # Click comments button on sidebar
    # It has data-testid="comments-button"
    comments_btn = page.locator('[data-testid="comments-button"]').first
    if comments_btn.is_visible():
        comments_btn.click()
        time.sleep(2) # Wait for animation
        page.screenshot(path="/home/jules/verification/comments_modal.png")
        print("Screenshot of comments modal saved.")
    else:
        print("Comments button not found.")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to mobile size to ensure layout is predictable
        page.set_viewport_size({"width": 375, "height": 812})
        try:
            verify_ui_changes(page)
        finally:
            browser.close()
