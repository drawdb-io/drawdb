# Accessibility Features in DrawDB

DrawDB is committed to providing an accessible experience for all users. This document outlines the accessibility features and improvements implemented in the application.

## Current Accessibility Features

### Keyboard Navigation

- **Skip to Main Content**: Press `Tab` on page load to reveal a "Skip to main content" link that allows keyboard users to bypass navigation and jump directly to the editor.
- **Full Keyboard Support**: All interactive elements are keyboard accessible using standard navigation keys (`Tab`, `Enter`, `Space`, `Escape`).
- **Keyboard Shortcuts**: The application includes numerous keyboard shortcuts for common actions. Press `?` or access Help → Shortcuts to view all available shortcuts.

### Screen Reader Support

- **ARIA Labels**: Interactive elements include descriptive ARIA labels to provide context for screen reader users.
- **ARIA Live Regions**: Dynamic content updates (like zoom level changes) are announced to screen readers.
- **Semantic HTML**: Proper use of semantic HTML elements (`<main>`, `<nav>`, `<button>`, etc.) for better screen reader navigation.
- **Icon Accessibility**: Decorative icons are marked with `aria-hidden="true"` to prevent screen readers from announcing redundant information.

### Visual Accessibility

- **Theme Support**: Light and dark theme options reduce eye strain and accommodate different visual preferences.
- **High Contrast**: Both themes provide sufficient contrast ratios for text and interactive elements.
- **Focus Indicators**: Clear visual focus indicators for keyboard navigation.
- **Zoom Controls**: Built-in zoom functionality with keyboard shortcuts and clear visual feedback.

### Language Support

- **Internationalization**: Support for 50+ languages with automatic detection based on user location and browser preferences.
- **RTL Support**: Right-to-left language support for Arabic, Hebrew, Urdu, and other RTL languages.

## Keyboard Shortcuts

### General

- `Ctrl/Cmd + N` - New diagram
- `Ctrl/Cmd + O` - Open diagram
- `Ctrl/Cmd + S` - Save diagram
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` - Redo
- `F11` - Toggle fullscreen
- `?` - View keyboard shortcuts

### Editor

- `Ctrl/Cmd + C` - Copy selected elements
- `Ctrl/Cmd + X` - Cut selected elements
- `Ctrl/Cmd + V` - Paste elements
- `Ctrl/Cmd + D` - Duplicate selected elements
- `Delete` or `Backspace` - Delete selected elements
- `Ctrl/Cmd + A` - Select all
- `Escape` - Deselect all

### Zoom

- `Ctrl/Cmd + +` - Zoom in
- `Ctrl/Cmd + -` - Zoom out
- `Ctrl/Cmd + 0` - Reset zoom

### View

- `Ctrl/Cmd + B` - Toggle sidebar
- `Ctrl/Cmd + /` - Toggle grid

## Testing and Validation

### Tools Used

- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Axe DevTools for automated accessibility auditing
- Lighthouse accessibility audit

### Known Limitations

1. **Canvas Interaction**: The diagram canvas is primarily mouse/touch-driven. Keyboard interaction for creating and connecting tables is limited.
2. **Complex Drag Operations**: Drag-and-drop operations for relationship creation require mouse/touch input.
3. **Color Perception**: While themes provide good contrast, users with color blindness may have difficulty distinguishing between certain relationship types or table colors.

## Future Improvements

### Planned Enhancements

- [ ] Enhanced keyboard-only diagram creation workflow
- [ ] Additional screen reader announcements for diagram state changes
- [ ] Customizable keyboard shortcuts
- [ ] Higher contrast mode option
- [ ] Keyboard-accessible relationship creation
- [ ] Voice control support
- [ ] Better focus management in modals and dialogs

### How to Contribute

We welcome contributions to improve accessibility! If you encounter accessibility issues or have suggestions:

1. **Report Issues**: Open an issue on GitHub with the label `accessibility`
2. **Test and Provide Feedback**: Test with your assistive technology and share your experience
3. **Submit PRs**: Contribute code improvements following our [Contributing Guidelines](CONTRIBUTING.md)
4. **Documentation**: Help improve this documentation with your insights

## Accessibility Standards

DrawDB aims to meet or exceed [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa) standards.

## Contact

If you need accessibility assistance or want to report an accessibility issue:

- **Discord**: [Join our Discord](https://discord.gg/BrjZgNrmR6)
- **Email**: drawdb@outlook.com
- **GitHub Issues**: Use the `accessibility` label

---

**Last Updated**: December 2025
