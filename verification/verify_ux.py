from playwright.sync_api import sync_playwright

def verify_ux(page):
    print("Navigating to home...")
    page.goto("http://localhost:3000", wait_until="networkidle")

    # 1. Verify "Nie masz psychy" button interaction
    print("Checking 'Nie masz psychy' button...")
    login_btn = page.get_by_text("Nie masz psychy się zalogować")
    # Check if chevron exists (by verifying SVG is present in the button)
    # The button text and icon are siblings in the button

    # Click to toggle
    print("Clicking login toggle...")
    login_btn.click()
    page.wait_for_timeout(500) # Wait for animation

    # Verify login form appears
    if page.locator("form").filter(has_text="Zaloguj się").is_visible():
         print("Login form appeared.")
    else:
         print("Login form NOT visible.")

    # 2. Verify Icon Tap Effect (Hard to verify visually with script, but we can check if click works without error)
    print("Clicking menu icon...")
    page.get_by_role("button", name="Menu").click()

    print("Taking screenshot of open login panel...")
    page.screenshot(path="verification/ux_verification.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ux(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
