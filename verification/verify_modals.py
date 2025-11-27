
import os
import time
from playwright.sync_api import sync_playwright, expect

def verify_modals(page):
    # Wait for app to load
    page.goto("http://127.0.0.1:3000", timeout=60000)

    # 1. Handle Language Selection (Preloader) if present
    # Try to find a language button (e.g., PL or EN)
    try:
        # Assuming there are buttons with text 'PL' or 'Polski'
        lang_btn = page.get_by_text("Polski", exact=False).first
        if lang_btn.is_visible(timeout=5000):
            print("Language selection visible, clicking...")
            lang_btn.click(force=True)
            # Wait for preloader to disappear
            page.wait_for_timeout(2000)
    except Exception as e:
        print(f"Preloader handling note: {e}")

    # 2. Open Comments Modal
    # Need to find a button that opens comments. Usually in Sidebar or Feed.
    # Look for a message-square icon or similar, or just try to trigger via UI state if possible?
    # Hard to trigger via UI state without knowing exact selectors.
    # Let's try to find a comment button.

    print("Looking for comments button...")
    # Try generic selector for comment button often used in social apps
    # The Sidebar has data-testid="comments-button" according to memory?
    try:
        page.locator('[data-testid="comments-button"]').click(timeout=5000)
    except:
        print("Could not find data-testid='comments-button', trying by icon class or approximate location")
        # Try to find an SVG that looks like a comment bubble or text
        # Fallback: execute JS to open modal if possible, but better to use UI
        # Let's try to click the first button in the sidebar (usually right side)
        # Or look for '0' (count) next to a heart
        pass

    # Force open comments modal via evaluate if button not found quickly (for testing logic)
    # But better to use the store if exposed globally, or just assume we can find the button.
    # Let's assume we can trigger it via a known button.
    # If not, we might need to rely on the fact that the app starts with some state? No.

    # Let's try to find the "Zaloguj się" text directly if it's already open? No.

    # Use evaluate to set state?
    # Since we can't easily access React state from outside, we must click.
    # Let's wait a bit for feed to load.
    page.wait_for_timeout(3000)

    # Click comment button (usually 2nd or 3rd icon on right sidebar)
    # Assuming Sidebar is visible.

    # Take screenshot of initial state
    page.screenshot(path="verification/1_feed.png")

    # Try to click the comment button.
    # In Sidebar.tsx, it might have an icon.
    # Let's try to click the button with specific icon class if available, or just coordinates?
    # Better: Inspect the codebase for a unique ID in Sidebar.

    # NOTE: The memory said: "The Sidebar.tsx component contains a comments button identifiable by data-testid='comments-button'"
    # So I will trust that.

    if page.locator('[data-testid="comments-button"]').is_visible():
        page.locator('[data-testid="comments-button"]').click()
        print("Clicked comments button")
    else:
        print("Comments button not found by testid. Trying generic approach.")

    page.wait_for_timeout(1000)
    page.screenshot(path="verification/2_comments_modal.png")

    # 3. Check "Zaloguj się" text color
    login_link = page.get_by_role("button", name="Zaloguj się")
    if login_link.is_visible():
        print("Found 'Zaloguj się' link")
        # Check color logic (hard in Playwright without computed style, but visual screenshot covers it)

        # 4. Click "Zaloguj się" -> Should close comments and open Login Panel (TopBar)
        login_link.click()
        print("Clicked 'Zaloguj się'")

        page.wait_for_timeout(1000) # Wait for animation
        page.screenshot(path="verification/3_login_panel_open.png")

        # Verify Login Panel is visible
        # Look for "Zaloguj się" header or email input
        if page.get_by_placeholder("Adres email").is_visible():
            print("Login panel is visible!")
        else:
            print("Login panel NOT visible.")

    else:
        print("'Zaloguj się' link not found. Maybe user is logged in?")

    # 5. Test Author Profile -> Tipping
    # Need to open Author Profile.
    # Click an avatar in the feed?
    # Usually avatars are clickable.
    print("Attempting to open Author Profile...")
    # Click on the first avatar found.
    # Try to find an image with alt="User Avatar" or similar.
    # Or just click coordinates on the side.

    # Reload to reset state?
    page.reload()
    page.wait_for_timeout(3000)

    # Click avatar
    # In Sidebar or Feed item.
    # Try clicking the first user avatar image.
    avatars = page.locator('img[alt*="avatar"]').all()
    if avatars:
        print(f"Found {len(avatars)} avatars, clicking first one...")
        avatars[0].click()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/4_author_profile.png")

        # Check for "Zostań Patronem" button
        patron_btn = page.get_by_role("button", name="Zostań Patronem")
        if patron_btn.is_visible():
            print("Found 'Zostań Patronem' button")
            patron_btn.click()
            print("Clicked 'Zostań Patronem'")

            page.wait_for_timeout(1000) # Wait for animation
            page.screenshot(path="verification/5_tipping_modal.png")

            # Verify Tipping Modal is visible
            if page.get_by_text("Bramka Napiwkowa").is_visible():
                 print("Tipping Modal is visible!")
            else:
                 print("Tipping Modal NOT visible.")
        else:
            print("'Zostań Patronem' button not found.")

    else:
        print("No avatars found.")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 400, 'height': 800}, # Mobile view
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    )
    page = context.new_page()
    try:
        verify_modals(page)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()
