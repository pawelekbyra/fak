
import os
import time
from playwright.sync_api import sync_playwright

def verify_tipping_modal_forced():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        print("Navigating...")
        try:
            page.goto("http://127.0.0.1:3000", timeout=60000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            return

        # Handle Preloader
        print("Handling preloader...")
        try:
            pl_btn = page.locator("text=Polski")
            if pl_btn.is_visible(timeout=5000):
                pl_btn.click(force=True)
                page.wait_for_selector(".absolute.inset-0.bg-black", state="hidden", timeout=5000)
        except Exception as e:
            print(f"Preloader step info: {e}")

        # Wait for forced modal open
        print("Waiting for forced modal...")
        try:
            page.wait_for_selector("text=Bramka Napiwkowa", timeout=10000)
            print("Modal opened!")
        except:
            print("Modal did not open.")
            page.screenshot(path="verification/failed_open.png")
            browser.close()
            return

        # Navigate Steps
        try:
            # Step 0: Recipient
            if page.locator("text=Pawłowi Polutkowi").is_visible():
                page.locator("text=Pawłowi Polutkowi").click()
                page.locator("button:has-text('ENTER')").click()
                page.wait_for_timeout(500)

            # Step 1: Account
            if page.locator("text=Założyć konto Patrona?").is_visible():
                page.locator("button:has-text('ENTER')").click()
                page.wait_for_timeout(500)

            # Step 2: Terms & Amount
            print("Step 2 Reached.")

            # 1. Terms View Verification
            page.locator("text=regulamin i Politykę Prywatności").click()
            page.wait_for_timeout(500)

            # Screenshot Terms
            if page.locator("text=1. Postanowienia ogólne").is_visible():
                print("Terms visible.")
                page.screenshot(path="verification/terms_view_success.png")
            else:
                print("Terms NOT visible.")

            # Return
            page.locator("button:has-text('Wróć do płatności')").click()
            page.wait_for_timeout(500)

            # 2. Validation Verification
            # Amount < 5 (PLN default)
            input_amount = page.locator("input[placeholder='0']")
            input_amount.fill("2")

            # Uncheck terms (should be unchecked by default)
            # Try submit
            page.locator("button:has-text('ENTER')").click()

            # Check if still on step 2 (Terms link visible)
            page.wait_for_timeout(500)
            if page.locator("text=regulamin i Politykę Prywatności").is_visible():
                print("Validation Correct: Blocked.")
            else:
                print("Validation Failed: Proceeded.")

            page.screenshot(path="verification/validation_blocked.png")

        except Exception as e:
            print(f"Step error: {e}")
            page.screenshot(path="verification/step_error.png")

        browser.close()

if __name__ == "__main__":
    verify_tipping_modal_forced()
