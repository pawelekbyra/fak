from playwright.sync_api import sync_playwright

def debug_page(page):
    print("Navigating to home...")
    page.goto("http://localhost:3000", wait_until="domcontentloaded")
    print("Taking debug screenshot...")
    page.screenshot(path="verification/debug_home.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            debug_page(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
