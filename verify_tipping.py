
import os
import time
from playwright.sync_api import sync_playwright

def verify_tipping_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport to match UI layout assumptions
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
            # Try to find language button. If not found quickly, maybe it's not there.
            # Using force=True to bypass potential overlays if any
            pl_btn = page.locator("text=Polski")
            if pl_btn.is_visible(timeout=5000):
                pl_btn.click(force=True)
                page.wait_for_selector(".absolute.inset-0.bg-black", state="hidden", timeout=5000)
            else:
                print("Preloader not found or already skipped.")
        except Exception as e:
            print(f"Preloader step info: {e}")

        # Wait for content to load
        page.wait_for_timeout(3000)

        # Try to open Tipping Modal via UI
        print("Attempting to open Tipping Modal...")
        modal_opened = False

        # Strategy: Find an avatar -> Open Profile -> Click 'Zostań Patronem'
        # The app usually renders a feed of slides.
        try:
            # Look for an avatar image in the feed (usually top left or sidebar)
            # In mobile view, the profile might be accessible via the slide author info.
            # Let's try clicking elements that look like user avatars.
            # Common pattern: img with alt='User Avatar' or similar.

            # Try finding the author info on a slide
            # Assuming standard slide layout
            avatar = page.locator("img[alt*='avatar']").first
            if avatar.is_visible():
                print("Found avatar, clicking...")
                avatar.click()
                page.wait_for_timeout(1000)

                # Look for "Zostań Patronem" button in the profile modal
                patron_btn = page.locator("button:has-text('Zostań Patronem')")
                if patron_btn.is_visible():
                    print("Found 'Zostań Patronem', clicking...")
                    patron_btn.click()
                    modal_opened = True
                else:
                    print("Could not find 'Zostań Patronem' button.")
            else:
                print("No avatars found on screen.")
                # Fallback: Is there a sidebar with a user list?
                # Or maybe we can trigger it via URL if supported? (e.g. /?modal=tipping - unlikely)

        except Exception as e:
            print(f"Interaction error: {e}")

        if not modal_opened:
            print("Failed to open modal via UI. Creating screenshot of current state.")
            page.screenshot(path="verification/failed_to_open.png")
            browser.close()
            return

        # Modal should be open. Verify header.
        try:
            page.wait_for_selector("text=Bramka Napiwkowa", timeout=5000)
            print("Modal successfully opened.")
        except:
            print("Modal header not found.")
            page.screenshot(path="verification/modal_not_visible.png")
            browser.close()
            return

        # Navigation steps
        print("Navigating steps...")

        # Step 0: Recipient (Select "Paweł" or "Nikt" - wait, "Nikt" closes it. Select "Paweł")
        try:
            page.locator("text=Pawłowi Polutkowi").click()
            page.locator("button:has-text('ENTER')").click()
            page.wait_for_timeout(500)

            # Step 1: Account (if not logged in)
            # Just click ENTER to proceed (optional account creation)
            if page.locator("text=Założyć konto Patrona?").is_visible():
                page.locator("button:has-text('ENTER')").click()
                page.wait_for_timeout(500)

            # Step 2: Amount & Terms
            print("Reached Step 2.")

            # Test 1: Click 'regulamin i Politykę Prywatności' to show terms
            terms_link = page.locator("text=regulamin i Politykę Prywatności")
            terms_link.click()
            page.wait_for_timeout(500)

            # Verify Terms View
            if page.locator("text=1. Postanowienia ogólne").is_visible():
                print("Terms View visible.")
                page.screenshot(path="verification/terms_view.png")
            else:
                print("Terms View NOT visible.")

            # Go back
            page.locator("button:has-text('Wróć do płatności')").click()
            page.wait_for_timeout(500)

            # Test 2: Validation (Low Amount, No Checkbox)
            # Uncheck if checked (default is unchecked)
            # Set amount to 2 PLN
            input_amount = page.locator("input[placeholder='0']")
            input_amount.fill("2")

            # Try to submit
            page.locator("button:has-text('ENTER')").click()

            # Expect error. Since it's a toast, we might not catch it easily with selectors if it disappears fast,
            # but we can check that we are still on Step 2 (Terms link is visible)
            page.wait_for_timeout(500)
            if page.locator("text=regulamin i Politykę Prywatności").is_visible():
                print("Validation working (blocked navigation).")
            else:
                print("Validation failed (navigated away).")

            # Take screenshot of validation state (amount 2, error toast might be visible)
            page.screenshot(path="verification/validation_state.png")

        except Exception as e:
            print(f"Step failure: {e}")
            page.screenshot(path="verification/error_state.png")

        browser.close()

if __name__ == "__main__":
    verify_tipping_modal()
