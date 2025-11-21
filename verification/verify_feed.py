
import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 390, 'height': 844}, # iPhone 12 Pro
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    )
    page = context.new_page()

    print("Navigating to home page...")
    try:
        page.goto("http://localhost:3000", timeout=60000)
    except Exception as e:
        print(f"Navigation failed: {e}")
        browser.close()
        return

    # Preloader handling
    print("Checking for Preloader language selection...")
    try:
        # Wait for the button with text "Polski"
        # Preloader has a 500ms delay before showing buttons
        polski_btn = page.get_by_text("Polski", exact=True)
        polski_btn.wait_for(state="visible", timeout=10000)
        print("Language button found. Clicking...")
        polski_btn.click()

        # Wait for Preloader to disappear (it has an exit animation)
        # We can wait for the button to detach or be hidden
        polski_btn.wait_for(state="hidden", timeout=5000)
        print("Preloader dismissed.")
    except Exception as e:
        print("Preloader interaction failed (maybe already bypassed?): ", e)
        page.screenshot(path="verification/preloader_fail.png")

    print("Waiting for feed content (.snap-start)...")
    try:
        # Wait for at least one slide
        slide = page.locator('.snap-start').first
        slide.wait_for(state="visible", timeout=30000)
        print("Feed loaded successfully.")
    except Exception as e:
        print("Slides did not load: ", e)
        page.screenshot(path="verification/error_state.png")
        print(page.content()) # Print HTML for debugging
        browser.close()
        return

    # Initial state
    page.wait_for_timeout(2000) # Let video load/play
    page.screenshot(path="verification/feed_initial.png")

    # Scroll test
    print("Scrolling down...")
    slides = page.locator('.snap-start')
    count_initial = slides.count()
    print(f"Initial slide count: {count_initial}")

    if count_initial > 1:
        # Scroll to the next slide
        # In a snap container, we scroll the container or the element into view
        # We need to find the scrollable container. In MainFeed it's the div with overflow-y-scroll
        # We can just scroll the second slide into view
        slides.nth(1).scroll_into_view_if_needed()
        page.wait_for_timeout(2000) # Wait for snap
        page.screenshot(path="verification/feed_scrolled.png")

    # Infinite scroll test
    print("Testing infinite scroll...")
    last_slide = slides.last
    last_slide.scroll_into_view_if_needed()
    page.wait_for_timeout(3000) # Wait for fetch

    count_new = slides.count()
    print(f"New slide count: {count_new}")

    if count_new > count_initial:
        print("Infinite scroll working!")
    else:
        print("Infinite scroll did not load new items (or end of list).")

    page.screenshot(path="verification/feed_infinite_scroll.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
