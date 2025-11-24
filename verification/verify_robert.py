from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_robert_ui(page: Page):
    print("Navigating to /robert...")
    page.goto("http://localhost:3000/robert")

    # Wait for the Language Selection modal if it appears (based on memory)
    # Memory says: "The application presents a language selection screen (modal) on first load."
    try:
        print("Checking for language selection...")
        # Wait a bit just in case
        page.wait_for_selector("text=Polski", timeout=5000)
        page.get_by_role("button", name="Polski").click()
        print("Language selected.")
    except Exception as e:
        print("No language selection found or timed out (might be bypassed or already selected). Continuing...")

    # Wait for Robert UI elements
    print("Waiting for Robert UI...")
    expect(page.get_by_text("Robert_v1.0.exe")).to_be_visible(timeout=30000)

    # Check for terminal elements
    expect(page.get_by_placeholder("Enter command...")).to_be_visible()

    # Check for Execute button
    execute_btn = page.get_by_role("button", name="Execute")
    expect(execute_btn).to_be_visible()

    # Type a message
    print("Typing message...")
    page.get_by_placeholder("Enter command...").fill("Hello Robert")

    # Take screenshot of the UI state
    print("Taking screenshot...")
    page.screenshot(path="verification/robert_ui.png")
    print("Screenshot saved to verification/robert_ui.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_robert_ui(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/robert_failure.png")
        finally:
            browser.close()
