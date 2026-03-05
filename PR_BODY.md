# Add Auto arrange + Generate sample data features

## Overview
This PR adds two new toolbar features to improve diagram management:
1. **Auto arrange** – repositions tables using a layered/topological layout to minimize relationship line crossings
2. **Generate sample data** – generates and downloads sample JSON data for all tables

## Features

### 1. Auto arrange button
- Click the Auto arrange button (sitemap icon) in the toolbar
- Tables reposition into layers based on relationship dependencies
- Heuristically orders tables within each layer by degree to reduce crossings
- Fallback to simple two-row layout if no relationships exist
- Supports undo/redo (tracked as bulk MOVE action)
- Disabled in read-only mode

**Algorithm**: Topological layering (Kahn's algorithm) groups tables into layers, then sorts by degree within each layer.

### 2. Generate sample data button
- Click the Generate sample data button (database icon) in the toolbar
- Downloads `sample_data_5.json` with 5 rows per table
- Generates realistic sample values based on field types:
  - `INT/SERIAL` → sequential numbers (1, 2, 3...)
  - `VARCHAR/TEXT/CHAR` → random alphanumeric strings
  - `TIMESTAMP/DATE` → current ISO timestamp
  - `BOOL` → random true/false
  - `JSON` → sample object `{ sample: true, i: index }`
  - `FLOAT/DOUBLE/REAL` → random decimal numbers
  - Others → random strings
- Disabled in read-only mode

## Files changed
- `src/utils/arrangeTables.js` – replaced simple two-row layout with layered topological layout
- `src/utils/generateSampleData.js` – new utility to generate sample rows per table
- `src/components/EditorHeader/ControlPanel.jsx` – added `autoArrange()` and `generateSample()` handlers, toolbar buttons, imports
- `src/i18n/locales/en.js` – added labels: `auto_arrange`, `generate_sample_data`, `sample_data_generated`

## Testing instructions

### Setup
```bash
npm install
npm run dev
```
Opens http://localhost:5174/

### Test Auto arrange
1. Go to `/editor` (blank) or load a template with relationships (e.g., `/editor/templates/1`)
2. In the toolbar, find the sitemap icon (Auto arrange button)
3. Click it
4. Verify:
   - Tables reposition into horizontal layers
   - Relationships have fewer crossing lines
   - Positions change from before/after
5. Press `Ctrl+Z` to undo and verify original positions restore
6. Press `Ctrl+Y` to redo and verify arrangement reapplies
7. Check browser console (DevTools) – no errors
8. Test on a diagram with no relationships – should use fallback layout

### Test Generate sample data
1. With the same diagram, find the database icon (Generate sample data button)
2. Click it
3. Verify:
   - A file `sample_data_5.json` downloads
   - Browser shows success toast: "Sample data generated and downloaded"
   - Open the JSON file – should contain table names as keys and arrays of 5 rows
   - Each row has fields matching the schema (e.g., `id`, `email`, `created_at`, etc.)
   - Values are realistic: integers for ID, strings for names, timestamps for dates
4. Check browser console – no errors
5. Test in read-only mode – button should be disabled

### Test both together
1. Load a complex diagram (e.g., template 3 or 6 with many relationships)
2. Click Auto arrange
3. Click Generate sample data
4. Verify sample data JSON contains all tables with correct schema (field names and realistic values). Sample data generation is schema-driven and independent of table coordinates, so positions don't affect the content.
5. Undo arrangement (`Ctrl+Z`), then redo (`Ctrl+Y`) – sample data file remains unchanged since it reflects schema, not visual layout

## Browser devtools checklist
- [ ] No console errors
- [ ] No warnings related to React key props or unmounted components
- [ ] Network tab: no failed requests

## Lint & Build
```bash
npm run lint      # Should pass with 0 errors
npm run build     # Should complete successfully
```

## Screenshots/recordings (optional)
- Before/after auto-arrange with tangled vs clean lines
- Clicking generate sample data and downloading the file
- Undo/redo behavior

## Related issues
Closes #XXX (if applicable)

## Checklist for reviewers
- [ ] Feature works: Auto arrange reduces line crossings
- [ ] Feature works: Sample data generates realistic data per field type
- [ ] Undo/Redo correctly reverts and reapplies positions
- [ ] Buttons disabled in read-only mode
- [ ] i18n labels present in English
- [ ] Lint passes
- [ ] No console errors
- [ ] Both features work independently and together
