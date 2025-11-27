from playwright.sync_api import sync_playwright, expect

def verify_system_notification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Intercept the notifications API call to return a mock system notification
        def handle_route(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body='{"success": true, "notifications": [{"id": "test-1", "type": "system", "text": "Witaj w Zordon! To jest test powiadomienia systemowego.", "read": false, "createdAt": "' + "2023-10-27T10:00:00Z" + '", "fromUser": null}]}'
            )

        page.route("**/api/notifications", handle_route)

        # Mock user context to simulate being logged in (since notifications are for logged in users)
        # However, since we can't easily mock the server-side session, we might need to rely on the UI state.
        # But wait, TopBar checks `user` context. If we are not logged in, we see the "logged out" view.
        # We need to simulate a logged-in state in the frontend.
        # Since the app uses a UserContext likely fed by an API or props, it might be tricky without a real session.

        # Alternative: We can try to force the modal open or use a simpler approach if we can't mock auth easily.
        # Let's try to mock the /api/auth/session or similar if NextAuth is used,
        # or just inject the state if possible.

        # Let's see if we can just "click" the notification bell if it's visible.
        # If the app starts in logged out state, we won't see the logged-in bell.

        # Strategy: Mock the session response.
        page.route("**/api/auth/session", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"user": {"name": "Test User", "email": "test@example.com", "image": "https://github.com/shadcn.png"}, "expires": "2099-01-01T00:00:00.000Z"}'
        ))

        # Navigate to home
        page.goto("http://localhost:3000")

        # Handle language preloader if it exists (click "Polski")
        try:
            page.get_by_text("Polski", exact=False).click(timeout=5000)
            print("Clicked language selection")
        except:
            print("Language selection not found or skipped")

        # Wait for the page to load
        page.wait_for_load_state("networkidle")

        # Now we need to find the notification bell.
        # In TopBar.tsx: aria-label={t('notificationAriaLabel')}
        # If we are logged in, we should see it.

        # Debug: check if we are logged in
        # page.screenshot(path="debug_home.png")

        # Click the bell
        # The aria-label depends on translation. Default "Powiadomienia" or "Notifications".
        # Let's try to find the bell icon or use the aria-label from the code if we know the translation key.
        # Key is 'notificationAriaLabel'.

        # Let's assume the mock session works. If not, we might see the login panel trigger.

        # Try to find the bell button.
        # It has a BellIcon inside.

        # Let's look for the button that opens the modal.
        # We can also try to evaluate script to open the modal: `useStore.setState({ activeModal: 'notifications' })`
        # but accessing the store from outside is hard.

        # Let's try clicking the button.
        try:
             # Try a generic selector for the bell icon button if aria-label is tricky
             # BellIcon is usually unique in the top bar for logged in users.
             # Or look for the red dot if we mocked unread count (we didn't).

             # Let's try to force the session to be recognized.
             # NextAuth client usually needs a provider.

             # If mocking session fails, I'll try to use a specialized test page or just rely on manual verification
             # instructions if I can't automate it.

             # But let's try.
             page.get_by_role("button").filter(has_text="Powiadomienia").first.click() # Heuristic
        except:
             # Fallback: look for the bell SVG
             # TopBar structure: Button > BellIcon
             pass

        # Actually, let's just wait for a bit and take a screenshot of the top bar to see if we are logged in.
        # Then we can refine the selector.

        page.screenshot(path="verification_step1.png")

        # If we can't easily click, I will try to verify the code changes via static analysis or request manual verification.
        # But let's try to find the button by a reliable selector.
        # The code uses `aria-label={t('notificationAriaLabel')}`.
        # In Polish it's likely "Powiadomienia".

        # Let's try to find the button with the bell icon.
        # We can search by the bell icon class or SVG.

        # Better yet, let's look at the `TopBar.tsx` again.
        # If user is present, it renders the logged in view.

        # If I can't login, I can't see the notifications.
        # Can I create a user? No, I want to verify the UI.

        # Let's try to mock the `useUser` context? No, that's internal to React.

        # Okay, let's assume the session mock works.
        # I'll search for the bell button using a CSS selector if needed.
        # button with BellIcon inside.

        bell_btn = page.locator("button:has(svg.lucide-bell)")
        if bell_btn.count() > 0:
            bell_btn.last.click() # The logged in one is likely the last one or we can check visibility.

            # Wait for modal
            page.wait_for_timeout(1000)

            # Screenshot the modal
            page.screenshot(path="verification_notification_modal.png")
            print("Screenshot taken: verification_notification_modal.png")
        else:
             print("Bell button not found")

if __name__ == "__main__":
    verify_system_notification()
