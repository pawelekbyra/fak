from playwright.sync_api import sync_playwright

def verify_modal_layout(page):
    print("Navigating to home...")
    page.goto("http://localhost:3000", wait_until="networkidle")

    # Handle language modal if exists
    try:
        page.get_by_role("button", name="Polski").click(timeout=3000)
        page.wait_for_timeout(500)
    except:
        pass

    # Open comments
    print("Opening comments...")
    # Try generic comment icon locators
    try:
        page.locator("button svg.lucide-message-square").first.click(timeout=5000)
    except:
        # Fallback search for a button with message square icon
        page.locator("button:has(svg.lucide-message-square)").first.click()

    page.wait_for_selector("text=Komentarze", timeout=5000)

    print("Checking layout structure...")
    # We want to check if the footer is visible at the bottom
    # Visually checking via screenshot is best for "sticky" behavior
    page.screenshot(path="verification/modal_layout_fix.png")
    print("Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_modal_layout(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/modal_error.png")
        finally:
            browser.close()
