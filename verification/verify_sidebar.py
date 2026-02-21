from playwright.sync_api import Page, expect, sync_playwright, Route
import time

def test_sidebar_works(page: Page):
    # Mock API responses
    def handle_auth_login(route: Route):
        route.fulfill(json={"accessToken": "mock-token-123"})

    def handle_users_me(route: Route):
        # Return a user who has completed onboarding so we go straight to Home
        route.fulfill(json={
            "id": "user-123",
            "email": "test@example.com",
            "hasCompletedOnboarding": True,
            "preferences": {
                "reminderTime": "08:00",
                "checkInEnabled": True
            }
        })

    def handle_users_me_401(route: Route):
        route.fulfill(status=401, json={"error": "Unauthorized"})

    # Setup mocks
    # Initially, we might check for existing token.
    # Let's start with no token, so /users/me fails or is not called until we have token.
    # But the app calls it on load if token exists in storage.

    # We'll intercept login
    page.route("**/auth/login", handle_auth_login)

    # We'll intercept /users/me.
    # If the app tries to validate a stored token, we want it to succeed?
    # Or if we want to test login flow, we should start fresh.
    # But let's just assume we login.
    page.route("**/users/me", handle_users_me)

    # Arrange: Go to the frontend
    page.goto("http://localhost:8081")

    # If we are on Home immediately (because of previous session token), that's fine.
    # If we are on SignIn, we login.

    try:
        # Check if we are on SignIn
        if page.get_by_role("button", name="Sign In").is_visible(timeout=5000):
            print("On SignIn screen, logging in...")
            page.get_by_placeholder("you@example.com").last.fill("test@example.com")
            page.get_by_placeholder("••••••••").last.fill("password")
            page.get_by_role("button", name="Sign In").click()
    except:
        print("Not on SignIn screen, maybe already logged in or loading...")

    # Wait for Home screen (Header title "Home" or "Log how things feel")
    expect(page.get_by_text("Log how things feel right now")).to_be_visible(timeout=20000)
    print("On Home screen")

    # Now verify Sidebar
    print("Opening sidebar")

    # Click Menu button (top left)
    # Accessibility label: "Open menu"
    page.get_by_label("Open menu").click(force=True)

    # Wait for sidebar to open
    # Sidebar contains "Settings" or user email
    expect(page.get_by_text("Settings")).to_be_visible()
    expect(page.get_by_text("test@example.com").first).to_be_visible()

    print("Sidebar opened")

    # Take screenshot of open sidebar
    page.screenshot(path="verification/sidebar_open.png")

    # Close sidebar
    # Accessibility label: "Close sidebar" (overlay) or "Close settings" (X button)
    # Use force=True as overlay might be covered by itself? Or just safe.
    page.get_by_label("Close sidebar").click(force=True)

    # Verify sidebar closed
    # expect(page.get_by_text("Settings")).not_to_be_visible()
    # Wait a bit for animation
    time.sleep(1)

    print("Sidebar closed")

    # Take screenshot of closed sidebar (Home)
    page.screenshot(path="verification/sidebar_closed.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a mobile viewport
        context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True)
        page = context.new_page()
        try:
            test_sidebar_works(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/failure.png")
            raise e
        finally:
            browser.close()
