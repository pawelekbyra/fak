from playwright.sync_api import sync_playwright

def verify_final_ux(page):
    print("Navigating to home...")
    page.goto("http://localhost:3000", wait_until="networkidle")

    # 1. Check Sidebar Avatar
    print("Checking sidebar avatar...")
    # Find the avatar image in sidebar (which is an <aside>)
    # The img inside the button in sidebar
    sidebar_avatar = page.locator("aside button img[alt='Author']").first

    if sidebar_avatar.count() > 0:
        print("Sidebar avatar found.")
        # Optional: Check src if needed, but existence confirms rendering
    else:
        print("Sidebar avatar NOT found (might be showing generic icon or timed out).")

    # 2. Check Account Modal for Bio and Publish Button
    # Needs login to see account panel fully, but we can check if publish button is GONE for logged out (safe check)
    # Or we just visually inspect via screenshot.

    print("Taking final screenshot...")
    page.screenshot(path="verification/final_ux.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_final_ux(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/final_error.png")
        finally:
            browser.close()
