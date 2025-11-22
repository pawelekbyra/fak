from playwright.sync_api import sync_playwright

def verify_comments_modal(page):
    print("Navigating to home...")
    # Go to home and wait for network idle to ensure everything is loaded
    page.goto("http://localhost:3000", wait_until="networkidle")

    # Handle language modal if it appears (based on memory)
    try:
        print("Checking for language modal...")
        page.get_by_role("button", name="Polski").click(timeout=5000)
        print("Language selected.")
    except Exception as e:
        print("Language modal check skipped or failed (might not be present):", e)

    # Wait for the feed to load (checking for a slide)
    print("Waiting for slides...")
    page.wait_for_selector(".slide-item", timeout=10000)

    # Click the comment button on the first slide
    # The comment button usually has a MessageSquare icon or similar.
    # Based on CommentsModal trigger in feed, we need to find the comment button.
    # In MainFeed, it's typically in the sidebar. We look for a button that likely opens comments.
    print("Opening comments modal...")

    # Try to find the comment button by icon or common class if role is generic
    # Using a selector strategy based on typical sidebar structure
    page.locator("button svg.lucide-message-square").first.click()

    # Wait for modal to appear
    print("Waiting for modal...")
    page.wait_for_selector("text=Komentarze", timeout=5000)

    # Take a screenshot of the modal to verify the footer layout and login button
    print("Taking screenshot...")
    page.screenshot(path="verification/comments_modal.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_comments_modal(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
