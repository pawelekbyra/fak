
import time
from playwright.sync_api import sync_playwright, expect

def verify_changes(page):
    # 1. Go to homepage
    page.goto("http://localhost:3000")

    # Wait for language selection (if present) or feed
    try:
        page.get_by_role("button", name="Polski").click(timeout=5000)
    except:
        pass # Maybe language already selected

    # Wait for feed to load
    page.wait_for_timeout(3000)

    # 2. Verify Tipping Modal (Stripe Logo)
    # Click Wallet icon in sidebar
    try:
        page.get_by_role("button", name="t").first.click() # The wallet icon might not have a clear accessible name, try by class or svg
    except:
        # Fallback to finding by icon class or sidebar structure
        # Sidebar usually has button with Wallet icon.
        # Let's try opening via store logic if possible, or just clicking buttons in sidebar.
        pass

    # Use evaluate to force open modals for screenshots if UI interaction is flaky
    page.evaluate("useStore.getState().openTippingModal()")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/tipping_modal.png")
    print("Tipping Modal screenshot taken.")

    # Close Tipping Modal
    page.evaluate("useStore.getState().closeTippingModal()")
    page.wait_for_timeout(500)

    # 3. Verify Author Profile Badge
    # Open Author Profile for a dummy ID
    page.evaluate("useStore.getState().openAuthorProfileModal('mock-author')")
    page.wait_for_timeout(2000) # Wait for fetch/mock
    page.screenshot(path="verification/author_profile.png")
    print("Author Profile screenshot taken.")

    # Close Author Modal
    page.evaluate("useStore.getState().closeAuthorProfileModal()")
    page.wait_for_timeout(500)

    # 4. Verify Notification Mocks
    # Login is required for notifications.
    # We can try to mock the login state or hit the API directly?
    # The UI component 'NotificationPopup' calls /api/notifications.
    # We can try to open the notification modal if we can bypass login or if we are logged in (guest mode usually doesn't show notifications).
    # If not logged in, we can't see notifications easily via UI.
    # However, I modified the API. I can verify the API returns mocks via python request or just skip UI verification for notifications if login is hard.
    # Let's try to fetch the API in the script context.

    # Actually, let's verify Patron Profile Badge
    page.evaluate("useStore.getState().openPatronProfileModal('mock-patron')")
    page.wait_for_timeout(2000)
    page.screenshot(path="verification/patron_profile.png")
    print("Patron Profile screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Expose useStore to window for easy manipulation
        # We need to make sure the app exposes it or we can't do the evaluate trick.
        # The app might not expose 'useStore' globally.
        # I'll rely on clicking UI if possible, or assume I can't easily force state without a devtool hook.
        # Wait, the prompt memory says "Global modals... managed via Zustand".
        # I can try to inject a script to expose it, but easier is to just click.

        # Rethink: I can't access `useStore` from `page.evaluate` unless it's attached to window.
        # I'll try to interact with the UI.

        try:
            # Navigate
            page.goto("http://localhost:3000")
            try:
                page.get_by_role("button", name="Polski").click(timeout=5000)
            except:
                pass
            page.wait_for_timeout(2000)

            # Open Tipping Modal (Wallet Icon)
            # Find the sidebar. It has buttons.
            # Looking at previous knowledge, Sidebar has Heart, MessageSquare, Share2, Wallet.
            # Wallet should be the 4th/5th icon.
            # I'll try to find an SVG with 'wallet' class or similar, or just click the button.
            # Inspecting `Sidebar.tsx` (from memory/previous): it renders Lucide icons.
            # I'll try to click the button that likely contains the Wallet icon.

            # Since I can't see the DOM, I'll take a screenshot of the feed first to debug locators if needed.
            page.screenshot(path="verification/feed_debug.png")

            # Try to click the tipping button (usually in Sidebar)
            # Assuming it's a button in the sidebar.
            # I will try generic selectors.

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        browser.close()
