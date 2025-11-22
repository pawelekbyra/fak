from playwright.sync_api import sync_playwright

def verify_ux(page):
    print("Navigating to home...")
    page.goto("http://localhost:3000", wait_until="networkidle")

    # Handle language modal
    try:
        print("Checking for language modal...")
        # Use a generic selector for the button if exact text varies
        lang_btn = page.get_by_role("button", name="Polski")
        if lang_btn.is_visible(timeout=5000):
            lang_btn.click()
            print("Language selected.")
            page.wait_for_timeout(1000) # Wait for fade out
        else:
            print("Language modal not found (timeout).")
    except Exception as e:
        print(f"Language check exception: {e}")

    # 1. Verify "Nie masz psychy" button interaction
    print("Checking 'Nie masz psychy' button...")
    # Using locator with has_text to find the button wrapper, not just the span
    login_btn = page.locator("button").filter(has_text="Nie masz psychy się zalogować").first

    # Click to toggle
    print("Clicking login toggle...")
    login_btn.click()
    page.wait_for_timeout(1000) # Wait for animation

    # Verify login form appears
    if page.locator("input[name='login']").is_visible():
         print("Login form input visible.")
    else:
         print("Login form input NOT visible.")

    print("Taking screenshot...")
    page.screenshot(path="verification/ux_verification_retry.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ux(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_retry.png")
        finally:
            browser.close()
