from playwright.sync_api import sync_playwright

def verify_setup(page):
    # The setup page should be accessible without login if middleware works correctly (or redirects if logged in first time)
    # But since we can't easily inject a user session here without complex setup,
    # we will try to access the page directly.
    # However, middleware might redirect to / if we are NOT logged in (it shouldn't, only admin is protected generally, but let's check middleware again).
    # Middleware:
    # if (session?.user?.isFirstLogin) -> redirect to /setup if not there.
    # if (!session?.user?.isFirstLogin && nextUrl.pathname === onBoardingPath) -> redirect to /.

    # So if we are NOT logged in, session is null. isFirstLogin check is false.
    # Then checking onBoardingPath ('/setup').
    # !session?.user?.isFirstLogin is TRUE (because session is null).
    # So unauthenticated users will be redirected to / if they try to access /setup.

    # Wait, my middleware logic:
    # if (!session?.user?.isFirstLogin && nextUrl.pathname === onBoardingPath)
    # if session is null, session?.user?.isFirstLogin is undefined -> falsy.
    # So !falsy is true.
    # So unauthenticated user going to /setup gets redirected to /.

    # This means I cannot verify /setup without logging in first.
    # But I can verify that the text "Polutek" is present on the main page (login screen).

    print("Navigating to home page...")
    page.goto("http://localhost:3000")

    # Wait for hydration
    page.wait_for_timeout(3000)

    # Check for text "Polutek" which we added to mock-db notification or email, but on the UI?
    # The user asked to change "Ting Tong" to "Polutek" everywhere.
    # Let's check the title.
    print("Checking title...")
    title = page.title()
    print(f"Page title: {title}")

    if "Polutek" not in title:
        print("FAIL: Title does not contain Polutek")
    else:
        print("SUCCESS: Title contains Polutek")

    page.screenshot(path="verification/home_polutek.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify_setup(page)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
