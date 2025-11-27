from playwright.sync_api import sync_playwright

def verify_safelock(page):
    # This verification is hard because we need to open an Author Profile.
    # To do that, we need a slide or user ID.
    # Assuming the app has some seeded data or main feed.
    # We can try to click on an author avatar in the feed.

    print("Navigating to home...")
    page.goto("http://127.0.0.1:3000")
    page.wait_for_timeout(3000)

    # Try to find an author link/avatar.
    # In the feed, typically there's a sidebar or bottom bar with user info.
    # Let's look for an avatar or username link.
    # Sidebar usually has "avatar-button" or similar.
    # Let's try to click a generic avatar in the sidebar.

    # Sidebar structure (from memory/previous):
    # - Sidebar is on the right.
    # - Contains Avatar, Like, Comment, Share.

    # Wait for hydration
    page.wait_for_timeout(2000)

    # Click first avatar found
    # We need to target something clickable that opens the profile.
    # Often it's an <a> or <button> with an image inside.

    # Let's try to find an element that looks like a profile trigger.
    # If no slides are loaded, we can't test this.
    # But usually seed data exists.

    # Try to find text starting with @ which usually indicates username
    try:
        username_el = page.locator("text=/^@/").first
        if username_el.is_visible():
            print("Found username, clicking...")
            username_el.click()
        else:
            # Fallback: try to find an avatar image
            print("Username not found, looking for avatar...")
            page.locator("img[alt*='avatar']").first.click()
    except:
        print("Could not find profile trigger. Screenshotting home.")
        page.screenshot(path="verification/safelock_fail_home.png")
        return

    page.wait_for_timeout(1000)

    # Now in AuthorProfileModal (hopefully).
    # Look for the lock icon tab (3rd tab).
    # Tabs are: Grid, Heart, Lock.

    print("Looking for private tab...")
    # Find the lock icon or the 3rd tab button.
    # The buttons are flex-1, 3 of them.
    # We can try to find the button with the lock icon.

    # In my code: <Lock size={20} /> inside a button.
    # Playwright can find by svg or just click the 3rd button in the tab list.

    tabs = page.locator("div.sticky button")
    if tabs.count() >= 3:
        print("Clicking 3rd tab...")
        tabs.nth(2).click()
        page.wait_for_timeout(500)

        # Now verify SafeLock is visible
        # Look for the "SECURE ACCESS" text or keypad buttons.
        if page.locator("text=SECURE ACCESS").is_visible():
             print("SafeLock found!")
             # Try typing 1234
             page.locator("button", has_text="1").click()
             page.locator("button", has_text="2").click()
             page.locator("button", has_text="3").click()
             page.locator("button", has_text="4").click()

             # Hit Enter (CornerDownLeft icon button)
             # Hard to select by icon, but it's the last button in the grid logic usually or near 0.
             # It's the button AFTER 0.
             # Grid structure: 1-9 (9 items). Bottom row: delete, 0, enter.
             # So it's the last button in the keypad container.

             keypad_buttons = page.locator(".grid button")
             enter_button = keypad_buttons.last
             enter_button.click()

             page.wait_for_timeout(500)
             # Should show error "BŁĄD"

             page.screenshot(path="verification/safelock_error.png")

             # Now try correct code: 96789
             # Wait for error to clear (600ms)
             page.wait_for_timeout(1000)

             page.locator("button", has_text="9").first.click()
             page.locator("button", has_text="6").first.click()
             page.locator("button", has_text="7").first.click()
             page.locator("button", has_text="8").first.click()
             page.locator("button", has_text="9").first.click()
             enter_button.click()

             page.wait_for_timeout(500)
             page.screenshot(path="verification/safelock_success.png")
             print("Success screenshot taken.")

        else:
             print("SafeLock text not found.")
             page.screenshot(path="verification/safelock_tab.png")
    else:
        print("Tabs not found or fewer than 3.")
        page.screenshot(path="verification/safelock_modal.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify_safelock(page)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
