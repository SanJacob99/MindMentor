## 2025-02-18 - Loading States & Accessible Toggles
**Learning:** Text replacement for loading states (e.g., "Saving...") causes layout shifts and lacks standard visual cues. Custom toggle buttons (using `TouchableOpacity`) are often invisible to screen readers as interactive elements.
**Action:** Always use `ActivityIndicator` inside a fixed-height button for async actions. Explicitly add `accessibilityRole="checkbox"` (or switch) and `accessibilityState={{ checked: ... }}` to custom toggle components.

## 2026-02-03 - Keyboard Navigation in Forms
**Learning:** Standard `TextInput` components do not automatically advance focus to the next field, causing friction in authentication flows. Explicitly chaining inputs using `ref`, `returnKeyType="next"`, and `onSubmitEditing` creates a native, polished feel.
**Action:** Always implement `returnKeyType` logic (Next/Go) and manual focus management for sequential form inputs.
## 2025-02-18 - Accessible Sliders
**Learning:** Sliders are often accessible by default but lack context for blind users who only hear a number. They need explicit text values (e.g., "Good", "High Stress") to be meaningful.
**Action:** Always provide `accessibilityValue={{ text: "..." }}` and `accessibilityRole="adjustable"` to Sliders to map the numeric value to a semantic description.

## 2025-10-27 - Accessible Data Visualization
**Learning:** Complex charts (Scatter, Line) rendered with SVG are completely invisible to screen readers. Relying on visual patterns excludes blind users.
**Action:** Always wrap the chart container in a View with accessibilityRole="image" and generate a dynamic accessibilityLabel that summarizes the key data points (e.g., averages, trends).

## 2024-05-21 - [Modal Accessibility]
**Learning:** `Animated.View` requires `onAccessibilityEscape` (not `accessibilityPerformEscape`) to handle the "scrub" gesture on iOS for closing modals. Also, `accessibilityViewIsModal` effectively traps screen reader focus even on non-native-modal views.
**Action:** Use `onAccessibilityEscape` and `accessibilityViewIsModal` for custom modal implementations to ensure full accessibility compliance.
