from playwright.sync_api import sync_playwright

def verify_setup_access(page):
    # This test is tricky because it requires being logged in with isFirstLogin=true.
    # We can't easily mock that state from the outside without seeding a specific user and logging in.
    # However, we can at least check if the server is running and if the /setup page renders SOMETHING,
    # even if it redirects unauthenticated users.
    # If it redirects to /, we can verify that.

    print("Navigating to /setup...")
    # Using 127.0.0.1 to avoid localhost issues
    page.goto("http://127.0.0.1:3000/setup")

    # Wait a bit
    page.wait_for_timeout(3000)

    # Check url. If redirected to /, it means middleware is working for unauth users.
    current_url = page.url
    print(f"Current URL: {current_url}")

    if current_url.endswith("/setup"):
        print("Stayed on /setup - Unauthenticated access allowed? (Or maybe redirected internally?)")
    else:
        print("Redirected from /setup - Expected behavior for unauthenticated user.")

    # Screenshot
    page.screenshot(path="verification/setup_redirect_check.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify_setup_access(page)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
