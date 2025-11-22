import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Allow time for server to start
    time.sleep(10)

    try:
        # 1. Test Tipping Modal
        print("Testing Tipping Modal...")
        page.goto("http://localhost:3000")

        # Wait for language selection if it appears (based on memory)
        try:
            page.get_by_role("button", name="Polski").click(timeout=5000)
            print("Language selected.")
        except:
            print("No language selection needed or timed out.")

        # Evaluate code to open tipping modal directly via store if possible,
        # or find a button. The 'Wallet' icon in Sidebar opens tipping modal?
        # Let's try to click the wallet icon.
        # Sidebar might be hidden or require interaction.
        # Let's try to force open via console since we have access to window (if store is exposed)
        # But store is inside React.
        # Let's click the Wallet icon. It uses Lucide 'Wallet'.

        # Wait for app to load
        page.wait_for_selector("body", timeout=30000)

        # Click Tipping/Wallet button (assuming it's in sidebar or topbar)
        # Based on files, it's likely in Sidebar.
        # Using a selector for the wallet icon or button containing it.
        # We can try to match the button by aria-label or icon.
        # If not found, we might struggle.

        # Alternative: The user mentioned "Wallet" (Tipping) icon in Sidebar.
        # Let's try to find it.
        try:
            page.locator("button:has(svg.lucide-wallet)").click(timeout=5000)
            print("Clicked Wallet button.")
        except:
            print("Could not find Wallet button. Trying to find text 'Napiwek' or similar if translated.")

        # Wait for modal
        expect(page.get_by_text("Bramka Napiwkowa")).to_be_visible(timeout=10000)

        # Check for Stripe image
        # It should be an image with src ending in stripe.png
        stripe_img = page.locator("img[src*='stripe.png']")
        expect(stripe_img).to_be_visible()
        print("Stripe image found.")

        page.screenshot(path="/home/jules/verification/tipping_modal.png")

        # Close tipping modal
        page.locator("button:has(svg.lucide-x)").click()


        # 2. Test Patron Modal via Comments
        print("Testing Patron Modal...")

        # We need to open comments.
        # Click comment icon (MessageSquare)
        page.locator("button:has(svg.lucide-message-square)").first.click()

        # Wait for Comments Modal
        expect(page.get_by_text("Komentarze")).to_be_visible(timeout=10000)

        # We need comments to exist. If empty, we can't test clicking avatar.
        # If no comments, we can try to add one (if logged in, but we are guest).
        # Guests see "Zaloguj się aby skomentować".
        # If API returns mock data or empty, we might be stuck.
        # Memory says "CommentsModal manages comment fetching... interacting with /api/comments".
        # If the DB is empty, no comments.
        # However, we can mock the network response for /api/comments!

        # Reload page to reset state and setup network interception
        page.goto("http://localhost:3000")
        try:
            page.get_by_role("button", name="Polski").click(timeout=2000)
        except:
            pass

        # Mock /api/comments
        page.route("**/api/comments*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='''{
                "success": true,
                "comments": [
                    {
                        "id": "c1",
                        "text": "Hello world",
                        "createdAt": "2023-01-01T12:00:00Z",
                        "updatedAt": "2023-01-01T12:00:00Z",
                        "slideId": "s1",
                        "authorId": "u1",
                        "likedBy": [],
                        "author": {
                            "id": "u1",
                            "username": "PatronUser",
                            "displayName": "Patron Display",
                            "avatar": "https://placehold.co/100x100"
                        }
                    }
                ],
                "nextCursor": null
            }'''
        ))

        # Mock /api/author/u1 for the profile
        page.route("**/api/author/u1", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='''{
                "id": "u1",
                "username": "PatronUser",
                "avatarUrl": "https://placehold.co/100x100",
                "bio": "I am a patron bio",
                "slides": []
            }'''
        ))

        # Open comments again
        # Need to wait for slides to load so the button is clickable
        time.sleep(2)
        page.locator("button:has(svg.lucide-message-square)").first.click()

        # Wait for comment to appear
        expect(page.get_by_text("Patron Display")).to_be_visible(timeout=10000)

        # Click the avatar
        # The avatar is inside the comment item.
        # Look for the image with alt "Avatar użytkownika Patron Display" or similar (based on translation)
        # Or just click the image inside the first comment.
        page.locator("div.flex.items-start.gap-3 > div.cursor-pointer").first.click()

        # Wait for Patron Modal
        expect(page.get_by_text("Profil Użytkownika")).to_be_visible()
        expect(page.get_by_text("PatronUser")).to_be_visible()
        expect(page.get_by_text("I am a patron bio")).to_be_visible()

        print("Patron modal verified.")
        page.screenshot(path="/home/jules/verification/patron_modal.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="/home/jules/verification/error.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
