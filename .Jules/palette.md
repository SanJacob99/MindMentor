## 2024-06-30 - Screen Reader Grouping
**Learning:** Legend items consisting of a colored indicator and text are read separately by screen readers if not properly grouped, leading to poor accessibility.
**Action:** Always wrap composite items like chart legends with `accessible={true}` and a descriptive `accessibilityLabel`.
