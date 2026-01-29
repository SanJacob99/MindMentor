from playwright.sync_api import sync_playwright
import time
import random
import string

def verify_insights():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        # Mock API
        def handle_signup(route):
            print("Mocking SignUp")
            route.fulfill(
                status=201,
                json={
                    "accessToken": "fake-jwt-token",
                    "user": {
                        "id": "user-123",
                        "email": "test@example.com",
                        "hasCompletedOnboarding": True # Skip onboarding
                    }
                }
            )

        def handle_summary(route):
            print("Mocking Insights Summary")
            route.fulfill(
                status=200,
                json={
                    "range": "7d",
                    "labels": ["2023-10-18", "2023-10-19", "2023-10-20", "2023-10-21", "2023-10-22", "2023-10-23", "2023-10-24"],
                    "dataset": {
                        "mood": [4, 5, 6, 8, 7, 8, 9],
                        "stress": [6, 5, 4, 3, 4, 3, 2],
                        "energy": [5, 6, 6, 7, 8, 7, 8]
                    },
                    "count": 7,
                    "averageMood": 6.7
                }
            )

        def handle_user(route):
             route.fulfill(
                 status=200,
                 json={
                     "id": "user-123",
                     "email": "test@example.com",
                     "hasCompletedOnboarding": True
                 }
             )

        # Intercept
        page.route("**/auth/signup", handle_signup)
        page.route("**/insights/summary*", handle_summary)
        page.route("**/users/me", handle_user)

        # 1. Navigate to app
        print("Navigating to app...")
        page.goto("http://localhost:8081")

        print("Waiting for content...")
        try:
            page.wait_for_selector('text="Sign In"', timeout=60000)
        except:
            print("Timeout waiting for Sign In.")
            page.screenshot(path="/home/jules/verification/error_load.png")
            browser.close()
            return

        print("On Sign In Screen.")

        # Go to Sign Up
        page.get_by_text("Don't have an account? Sign Up").click()

        print("On Sign Up Screen.")
        page.wait_for_selector('text="Create Account"')

        time.sleep(1)

        # Fill Form
        email_inputs = page.get_by_placeholder("you@example.com").all()
        for inp in email_inputs:
            if inp.is_visible():
                inp.fill("test@example.com")
                break

        pass_inputs = page.get_by_placeholder("••••••••").all()
        for inp in pass_inputs:
            if inp.is_visible():
                inp.fill("password123")
                break

        # Click Sign Up button
        print("Clicking Sign Up button...")
        try:
             page.get_by_role("button", name="Sign Up").click(timeout=1000)
        except:
             # Try text exact
             buttons = page.get_by_text("Sign Up", exact=True).all()
             for btn in reversed(buttons):
                 if btn.is_visible():
                     btn.click()
                     break

        print("Waiting for Home screen (skipping onboarding)...")
        try:
            # Should go to Home "Today"
            page.wait_for_selector('text="Today"', timeout=20000)
            print("Found Home Screen.")

            print("Looking for Insights tab...")
            page.get_by_text("Insights").click()

            # Wait for Insights content
            page.wait_for_selector('text="What\'s been changing lately"', timeout=5000)
            time.sleep(3) # Wait for charts to render/animate

            print("Taking screenshot...")
            page.screenshot(path="/home/jules/verification/insights_screen.png")

        except Exception as e:
            print(f"Failed to reach Home or Insights: {e}")
            page.screenshot(path="/home/jules/verification/error_insights.png")

        browser.close()

if __name__ == "__main__":
    verify_insights()
