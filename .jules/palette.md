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

## 2026-03-03 - Grouping Information for Screen Readers
**Learning:** Read-only lists or settings rows rendered as individual text nodes force screen reader users to navigate too many elements (e.g., "Notifications", then "Enabled"). Icon-only buttons (like "Close") without labels are completely unusable.
**Action:** Group related text elements using `accessible={true}` on the container and provide a combined `accessibilityLabel`. Always add `accessibilityLabel` to icon-only `TouchableOpacity` components.

## 2026-06-25 - Accessible Links in React Native
**Learning:** `TouchableOpacity` components wrapping text (e.g., "Don't have an account? Sign Up") are often treated as generic buttons or not announced as actionable links by screen readers. Splitting text into multiple `Text` children can cause fragmented announcements.
**Action:** Use `accessibilityRole="link"` for navigation actions and provide a combined `accessibilityLabel` for multi-part text links. Add `hitSlop` to small text-based touch targets.

## 2027-01-14 - Android Back Button Handling for Overlays
**Learning:** Custom overlays and sidebars implemented with absolute positioning do not automatically intercept the Android hardware back button. Users expect the back button to close the overlay, but default behavior often exits the app or navigates back in the stack, causing frustration.
**Action:** Always implement `BackHandler` listeners for custom overlay/drawer components on Android to intercept `hardwareBackPress` and close the overlay.
## 2026-10-27 - Auto-Select & List Expansion
**Learning:** When users add a new item to a sorted list (e.g., tags sorted by frequency), the new item often appears at the end, outside the initial visible viewport. This leaves users confused about whether their action succeeded.
**Action:** Always auto-select the newly created item and expand the list or scroll to the item to provide immediate visual confirmation of success.
## 2025-05-18 - Segmented Controls in React Native
**Learning:** Range pickers or segmented controls built with `TouchableOpacity` are often inaccessible. Screen readers do not know they are selectable tabs or which one is active.
**Action:** Always add `accessibilityRole="tab"` and `accessibilityState={{ selected: boolean }}` to items acting as segmented controls.

## 2025-03-01 - Hit Slops for Small Touchable Components
**Learning:** Icon-only buttons or touchable areas that are too small can be difficult to tap, particularly on mobile. Adding `hitSlop` is crucial to ensure smooth user interactions.
**Action:** Always add `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` to icon-only buttons (`TouchableOpacity` components rendering just an icon) to increase the tap target size without modifying the visual layout.

## 2026-11-20 - Empty State Placeholders
**Learning:** Using plain, unstyled text for empty states (e.g., "No data available") creates a jarring user experience, particularly on screens that are otherwise visually rich or analytical.
**Action:** Always replace unstyled empty states with a visually consistent placeholder. Use existing design tokens, incorporate a relevant icon (e.g., `Sparkles` or `PenLine`), provide a clear title, and offer encouraging or explanatory guidance text to set user expectations.
## 2027-10-24 - Switch Accessibility & Touch Targets
**Learning:** The native `Switch` component has a small hit target, making it difficult to toggle reliably. Furthermore, placing text adjacent to a standalone `Switch` forces screen reader users to navigate between the description and the interactive element separately, losing context.
**Action:** Always wrap the `Switch` and its accompanying text within a single `TouchableOpacity` (with `accessibilityRole="switch"`, `accessibilityState={{ checked: value }}`, and `activeOpacity={0.7}`). Wrap the internal `Switch` in a `<View pointerEvents="none">` so the parent touchable captures the interaction, increasing the effective hit area and combining context for screen readers.

## 2024-10-25 - Avoid `, selected` anti-pattern for a11y states
**Learning:** React Native custom tab components or segmented controls using `TouchableOpacity` must explicitly define `accessibilityRole="tab"` and `accessibilityState={{ selected: boolean }}` to be properly announced by screen readers. Appending `, selected` text dynamically to the `accessibilityLabel` itself is an anti-pattern.
**Action:** When implementing tabs or toggleable active elements, ensure semantic states (like `accessibilityState`) are used rather than modifying the readable label text to communicate UI state.

## 2026-03-03 - Keyboard Types and Autofill in Forms
**Learning:** Default text inputs in mobile forms often present a standard keyboard, which requires extra taps to enter common characters like "@" in email fields. Furthermore, not declaring input semantics prevents native password managers and system auto-fill from offering saved credentials, heavily degrading the user experience during sign in and sign up.
**Action:** Always provide explicit semantic properties for text inputs: use `keyboardType="email-address"`, `autoComplete="email"`, `textContentType="emailAddress"`, and `autoCorrect={false}` for email fields. Use `textContentType="password"` or `textContentType="newPassword"` alongside `secureTextEntry` for password fields.
## 2023-10-27 - Destructive Action Confirmation
**Learning:** Destructive actions like logging out are often implemented without a confirmation step, leading to accidental clicks and user frustration. When building for multi-platform (React Native + Web), a single approach doesn't work.
**Action:** Always add a confirmation dialog for destructive actions. Use `Alert.alert` for native platforms and fallback to `window.confirm` via a `Platform.OS === 'web'` check to ensure a native feel across all environments.

## 2024-03-16 - Empty State Call-to-Actions
**Learning:** Even well-designed empty states with icons and text can feel like a dead end if they don't provide a way out. Users landing on an empty 'Insights' screen need a quick way to generate data.
**Action:** Always include a primary Call-to-Action (CTA) button in empty states that navigates the user directly to the screen where they can perform the action needed to populate the data.

## 2025-05-18 - Clear Buttons in Text Inputs
**Learning:** Lengthy text inputs (like optional notes or journal entries) can be cumbersome to clear manually on mobile devices, especially when the text overflows the visible area. While a clear button is standard on small inputs like email, it's often overlooked on multiline inputs.
**Action:** Always conditionally render a clear button (e.g., an 'X' icon) inside the input container when `text.length > 0`. Ensure it is wrapped in a `TouchableOpacity` with a proper `hitSlop`, `accessibilityRole="button"`, and `accessibilityLabel="Clear note"`.

## 2024-11-13 - Avoid Instructional Hints in Accessibility Attributes
**Learning:** Hardcoding gesture instructions (like "Double tap to...") directly into `accessibilityLabel` creates redundancy since the OS naturally appends role-based actions (e.g., "button, double tap to activate"). Additionally, hardcoding "Double tap" in `accessibilityHint` is restrictive and assumes touch input, which may not be accurate for all assistive technologies (like voice control or switch access).
**Action:** Use `accessibilityLabel` solely to describe what the element is or its current value. Use `accessibilityHint` to concisely describe the *result* of interacting with the element (e.g., "Opens the settings menu") without dictating *how* to interact.

## 2026-03-04 - Visible Focus States for Keyboard Navigation
**Learning:** React Native `TextInput` components do not inherently show a strong visual focus state, especially on the web build where default browser outline styles might clash with or be overridden by custom Tailwind borders, leaving keyboard users without visual cues.
**Action:** Always explicitly manage focus state using `onFocus` and `onBlur` handlers to dynamically update the border color of the input container. Add `style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : undefined}` to suppress default browser rings and rely on the custom border for a polished, accessible experience.
