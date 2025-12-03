# DrawDB Tests

This directory contains comprehensive tests for DrawDB, focusing on accessibility features, internationalization, and component functionality.

## Test Setup

The project uses [Vitest](https://vitest.dev/) as the testing framework along with:

- **@testing-library/react**: For React component testing
- **@testing-library/user-event**: For simulating user interactions
- **@testing-library/jest-dom**: For additional DOM matchers
- **jsdom**: For DOM environment simulation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test locationLanguageDetector.test.js

# Run tests matching a pattern
npm test -- --grep "accessibility"
```

## Test Structure

```
src/test/
├── setup.js                           # Test environment setup
├── locationLanguageDetector.test.js   # Location-based language detection tests
├── accessibility.test.jsx             # General accessibility tests
└── FloatingControls.test.jsx          # Component-specific accessibility tests
```

## Test Coverage

### Location Language Detector (`locationLanguageDetector.test.js`)

Tests the automatic language detection based on user location:

- ✅ IP-based geolocation detection
- ✅ Regional language detection (e.g., Indian states)
- ✅ Fallback to browser language
- ✅ LocalStorage caching
- ✅ API timeout handling
- ✅ Multiple country/language mappings
- ✅ Edge cases and error handling

### Accessibility Features (`accessibility.test.jsx`)

Tests WCAG 2.1 compliance and accessibility features:

- ✅ Skip to main content link
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Semantic HTML structure
- ✅ Screen reader compatibility
- ✅ Live regions for dynamic content
- ✅ Form accessibility
- ✅ Color contrast
- ✅ Reduced motion support
- ✅ Touch target sizes
- ✅ Modal/dialog accessibility

### Component Tests (`FloatingControls.test.jsx`)

Tests accessibility of UI components:

- ✅ ARIA attributes on controls
- ✅ Keyboard interaction (Tab, Enter, Space)
- ✅ Icon accessibility (aria-hidden)
- ✅ Live region announcements
- ✅ Tooltip and title attributes
- ✅ Focus indicators

## Writing New Tests

### Example Test Structure

```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Feature Name", () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  it("should do something specific", async () => {
    const user = userEvent.setup();
    render(<YourComponent />);

    const element = screen.getByRole("button");
    await user.click(element);

    expect(element).toBeInTheDocument();
  });
});
```

### Testing Accessibility

When writing accessibility tests, verify:

1. **ARIA Attributes**: All interactive elements have appropriate roles and labels
2. **Keyboard Navigation**: Components can be operated with keyboard only
3. **Focus Management**: Focus is visible and moves logically
4. **Screen Reader Support**: Content is announced correctly
5. **Semantic HTML**: Proper use of HTML5 semantic elements

### Common Test Patterns

```javascript
// Testing keyboard navigation
await user.tab();
expect(element).toHaveFocus();

// Testing ARIA labels
const button = screen.getByLabelText("Close dialog");
expect(button).toHaveAttribute("aria-label", "Close dialog");

// Testing screen reader announcements
const liveRegion = screen.getByRole("status");
expect(liveRegion).toHaveAttribute("aria-live", "polite");

// Testing semantic structure
const main = screen.getByRole("main");
expect(main).toHaveAttribute("id", "main-content");
```

## Continuous Integration

Tests should be run in CI/CD pipelines before merging:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Generate coverage report
  run: npm run test:coverage
```

## Coverage Goals

We aim for:

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 80%

Focus on testing:

- Critical user paths
- Accessibility features
- Error handling
- Edge cases

## Debugging Tests

### Visual Debugging

```bash
# Run with UI for visual debugging
npm run test:ui
```

### Debug Output

```javascript
import { screen } from "@testing-library/react";

// Print current DOM structure
screen.debug();

// Print specific element
screen.debug(screen.getByRole("button"));
```

### Using Vitest UI

The Vitest UI provides:

- Visual test runner
- Real-time test results
- Coverage visualization
- Test filtering and searching

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what users see and do
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock External Dependencies**: Keep tests isolated and fast
4. **Write Descriptive Test Names**: Make failures easy to understand
5. **Keep Tests Simple**: One concept per test
6. **Use beforeEach for Setup**: Keep tests DRY
7. **Test Accessibility**: Verify WCAG compliance in component tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure tests pass locally
3. Check coverage doesn't decrease
4. Add accessibility tests for new UI components
5. Update this README if adding new test patterns

## Troubleshooting

### Tests failing with "Cannot find module"

```bash
npm install
```

### Mock not working

Ensure mocks are defined before imports:

```javascript
vi.mock('./module', () => ({ ... }))
import { something } from './module'
```

### Async tests timing out

Increase timeout or check for missing awaits:

```javascript
it(
  "test",
  async () => {
    await user.click(button); // Don't forget await!
  },
  { timeout: 10000 },
);
```
