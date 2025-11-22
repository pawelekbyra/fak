
from playwright.sync_api import sync_playwright

def verify_forced_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")
        try:
             page.get_by_role("button", name="Polski").click(timeout=3000)
        except:
             pass

        page.wait_for_timeout(2000)
        page.screenshot(path="verification/tipping_modal_forced.png")
        browser.close()

if __name__ == "__main__":
    verify_forced_modal()
