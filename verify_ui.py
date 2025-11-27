from playwright.sync_api import sync_playwright

def verify_ui_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use user data dir to persist session if possible, but for now we mock
        context = browser.new_context()
        page = context.new_page()

        # Step 1: Visit page
        # Note: In this environment, we need to bypass first login or handle it.
        # However, the user wants us to Verify First Login Modal LOGS.
        # But we also want to verify the Tipping Modal animation visually if possible.

        # We need to simulate a logged-in user for Author Profile -> Tipping Modal
        # Or a first-time user for First Login Modal.

        # Let's try to verify Tipping Modal visuals first, as logs are hard to verify via screenshot.
        # We can open the page, inject some state or click through.

        try:
            print("Navigating to home...")
            page.goto("http://127.0.0.1:3000")

            # Handle Preloader (Language Selection)
            # Memory says: "The application shows a full-screen language selection overlay... Test scripts must first select a language"
            print("Handling language selection...")
            try:
                page.wait_for_selector('text="Polski"', timeout=5000)
                page.get_by_text("Polski").click(force=True)
                # Wait for preloader to disappear
                page.wait_for_timeout(2000)
            except Exception as e:
                print(f"Preloader handling might have failed or skipped: {e}")

            # Now we are on the main page (Feed).
            # To test Tipping Modal animation from Author Profile, we need to open Author Profile.
            # Usually clicking on an avatar in the feed opens it.

            print("Looking for an avatar to click...")
            # Assuming there are slides. If no slides, we might be stuck.
            # Let's try to find an avatar image or button.
            # Sidebar usually has an avatar.

            # Note: Sidebar might require slides to render (memory).
            # If DB is empty, we might see nothing.

            # Let's take a screenshot of the landing to see where we are.
            page.screenshot(path="/home/jules/verification/step1_landing.png")

            # If we see the feed, we can try clicking the avatar.
            # Usually in the sidebar or bottom info.
            # Sidebar Avatar:

            avatar = page.locator('img[alt="Avatar"]').first
            if avatar.is_visible():
                print("Clicking avatar...")
                avatar.click()
                page.wait_for_timeout(1000) # Wait for animation

                # Now Author Profile Modal should be open.
                page.screenshot(path="/home/jules/verification/step2_author_profile.png")

                # Click "Zostań Patronem"
                print("Clicking 'Zostań Patronem'...")
                patron_btn = page.get_by_text("Zostań Patronem")
                if patron_btn.is_visible():
                    patron_btn.click()
                    page.wait_for_timeout(1000) # Wait for Tipping Modal animation

                    # Now Tipping Modal should be visible OVER Author Profile Modal
                    page.screenshot(path="/home/jules/verification/step3_tipping_modal.png")
                    print("Screenshots taken.")
                else:
                    print("Button 'Zostań Patronem' not found.")
            else:
                print("Avatar not found. Check step1_landing.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ui_changes()
