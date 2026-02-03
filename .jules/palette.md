## 2025-02-18 - Loading States & Accessible Toggles
**Learning:** Text replacement for loading states (e.g., "Saving...") causes layout shifts and lacks standard visual cues. Custom toggle buttons (using `TouchableOpacity`) are often invisible to screen readers as interactive elements.
**Action:** Always use `ActivityIndicator` inside a fixed-height button for async actions. Explicitly add `accessibilityRole="checkbox"` (or switch) and `accessibilityState={{ checked: ... }}` to custom toggle components.

## 2025-02-18 - Accessible Sliders
**Learning:** Sliders are often accessible by default but lack context for blind users who only hear a number. They need explicit text values (e.g., "Good", "High Stress") to be meaningful.
**Action:** Always provide `accessibilityValue={{ text: "..." }}` and `accessibilityRole="adjustable"` to Sliders to map the numeric value to a semantic description.
