
from playwright.sync_api import sync_playwright
import time

def verify_robert_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 412, 'height': 915} # Mobile viewport
        )
        page = context.new_page()

        # Navigate to the Robert chat page
        print("Navigating to Robert page...")
        try:
            page.goto("http://localhost:3000/robert")
            page.wait_for_load_state("networkidle")

            # Since the Robert page is protected or requires interaction to fully render specific parts,
            # we just want to verify the input field and structure exists,
            # as the API functionality can't be tested without a key.

            # Check for key elements from the new code
            # "Enter command..." placeholder
            input_field = page.get_by_placeholder("Enter command...")
            if input_field.is_visible():
                print("Input field visible.")
            else:
                print("Input field NOT visible.")

            # Take a screenshot
            page.screenshot(path="verification/robert_page.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_robert_page()
