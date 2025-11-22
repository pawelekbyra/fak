import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Log requests to debug mock interception
    page.on("request", lambda request: print(f">> {request.method} {request.url}"))
    page.on("response", lambda response: print(f"<< {response.status} {response.url}"))

    # Mock Admin User Session
    page.route("**/api/account/status", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='''{
            "isLoggedIn": true,
            "user": {
                "id": "admin-1",
                "email": "admin@example.com",
                "username": "AdminUser",
                "displayName": "Admin Display",
                "role": "admin",
                "avatar": "https://placehold.co/100x100"
            }
        }'''
    ))

    print("Navigating to home...")
    # Wait for networkidle to ensure initial hydration fetches are done
    try:
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    except Exception as e:
        print(f"Navigation error: {e}")
        # Try to proceed anyway if it's just a timeout on idle

    # Wait for hydration
    page.wait_for_timeout(3000)

    # Take screenshot of initial state
    page.screenshot(path="/home/jules/verification/home_state.png")

    if page.get_by_text("Nie masz psychy").is_visible():
        print("ERROR: User appears logged out. Mock failed.")
    else:
        print("User appears logged in.")

    # Open Hamburger Menu
    print("Opening menu...")
    # Try different selectors if needed.
    try:
        page.get_by_label("Menu", exact=False).first.click()
    except:
        # Fallback
        page.locator("button:has(svg.lucide-menu)").first.click()

    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/menu_open.png")

    # Click Zarządzaj
    print("Clicking Zarządzaj...")
    manage_btn = page.get_by_text("Zarządzaj")
    if manage_btn.is_visible():
        manage_btn.click()
        print("Clicked.")
    else:
        print("ERROR: 'Zarządzaj' button not visible in menu.")
        return

    # Verify Modal
    expect(page.get_by_text("Panel Administratora")).to_be_visible(timeout=10000)
    print("Admin Modal Verified.")
    page.screenshot(path="/home/jules/verification/admin_modal_success.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
