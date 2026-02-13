from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 400, 'height': 800})
    page = context.new_page()

    # Mock APIs
    page.route("**/auth/login", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"accessToken": "fake-token"}'
    ))

    page.route("**/users/me", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"id": "1", "email": "test@example.com", "hasCompletedOnboarding": true}'
    ))

    page.route("**/entries", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='[]'
    ))

    page.route("**/recommendations", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='[]'
    ))

    page.route("**/insights/summary*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"dataset": {"mood": [5, 6, 7], "stress": [4, 3, 2], "energy": [6, 7, 8]}, "labels": ["2023-10-01", "2023-10-02", "2023-10-03"]}'
    ))

    # Go to app
    try:
        page.goto("http://localhost:8081", timeout=60000)
    except Exception as e:
        print(f"Failed to load page: {e}")
        browser.close()
        return

    # Login flow
    try:
        page.get_by_label("Email Address").fill("test@example.com")
        page.get_by_label("Password", exact=True).fill("password")
        page.get_by_role("button", name="Sign In").click(force=True)
    except Exception as e:
        print(f"Login failed: {e}")
        page.screenshot(path="verification/error_login.png")
        browser.close()
        return

    # Wait for Home Screen
    try:
        expect(page.get_by_text("Patterns so far")).to_be_visible(timeout=20000)
    except Exception as e:
        print(f"Home screen failed to load: {e}")
        page.screenshot(path="verification/error_home.png")
        browser.close()
        return

    # Click "View all"
    try:
        view_all_button = page.get_by_label("View all patterns")
        view_all_button.click(force=True)
    except Exception as e:
        print(f"Click view all failed: {e}")
        page.screenshot(path="verification/error_click.png")
        browser.close()
        return

    # Verify navigation to Insights Screen
    try:
        # Check for unique text on Insights screen
        expect(page.get_by_text("What's been changing lately")).to_be_visible(timeout=10000)
    except Exception as e:
        print(f"Navigation failed: {e}")
        page.screenshot(path="verification/error_nav.png")
        browser.close()
        return

    # Take screenshot
    page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
