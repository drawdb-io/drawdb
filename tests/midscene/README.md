# Midscene browser tests

These tests exercise two local MySQL diagram workflows:

- Create `users` and `orders` through the UI, connect their fields, wait for autosave, and reload the saved diagram.
- Import `fixtures/shop.sql` through the file picker, rename `users.name` to `display_name`, and download and parse the exported SQL.

Midscene operates the visible controls and checks the rendered diagram. Additional assertions read IndexedDB without modifying it and parse the actual browser download to verify table names, columns, primary keys, and relationship endpoints. Each file uses fresh browser storage. No account or sharing service is required.

## Run

Use Node.js 24 and Google Chrome. Install the locked dependencies with `npm ci`. Configure a supported Midscene vision model in your shell (keep credentials out of the repository):

```sh
export MIDSCENE_MODEL_BASE_URL=https://api.openai.com/v1
export MIDSCENE_MODEL_NAME=gpt-6.1-terra
export MIDSCENE_MODEL_FAMILY=gpt-6
export MIDSCENE_MODEL_PROTOCOL=openai-responses
export MIDSCENE_MODEL_REASONING_EFFORT=low
export MIDSCENE_MODEL_API_KEY=your-api-key
npm run test:e2e
```

The model is an example; select a model and matching family available to your provider. Requests send browser screenshots to that provider and incur its normal charges. Provider errors, including rate limits, fail the run.

The command builds the app and serves the production build at `http://127.0.0.1:4180`. Leave that port free. Production preview avoids development-server reloads when test reports are written. To rerun an existing build, use `npm run test:e2e:run`. Set `HEADLESS=false` to watch Chrome, or `BROWSER_CHANNEL` to another installed Playwright browser channel.

```sh
npm run test:e2e:check # Typecheck and validate custom node registration; no model calls
```

Runs are serial with no case retries. Each case has a ten-minute timeout. The runner prints report locations; generated artifacts live under `tests/midscene/.midscene/` and `tests/midscene/midscene_run/` and are ignored by Git. Preserve both directories when collecting failed-run evidence, including screenshots and model errors.

## GitHub Actions and online reports

The **Midscene E2E** workflow is opt-in. It runs on manual dispatch and relevant pushes to `main` or the integration branch `test/midscene`. It does not run paid model calls or expose credentials on pull-request events.

Configure these repository Actions variables and secrets in your fork (or in the upstream repository if maintainers enable it):

| Kind     | Name                              | Example                                               |
| -------- | --------------------------------- | ----------------------------------------------------- |
| Variable | `MIDSCENE_E2E_ENABLED`            | `true`                                                |
| Variable | `MIDSCENE_MODEL_NAME`             | `gpt-6.1-terra`                                       |
| Variable | `MIDSCENE_MODEL_FAMILY`           | `gpt-6`                                               |
| Variable | `MIDSCENE_MODEL_PROTOCOL`         | `openai-responses`                                    |
| Variable | `MIDSCENE_MODEL_BASE_URL`         | `https://api.openai.com/v1`                           |
| Variable | `MIDSCENE_MODEL_REASONING_EFFORT` | `low`                                                 |
| Secret   | `MIDSCENE_MODEL_API_KEY`          | Model provider API key                                |
| Variable | `CLOUDFLARE_ACCOUNT_ID`           | Your Cloudflare account ID                            |
| Variable | `MIDSCENE_PAGES_PROJECT`          | An existing Pages project name                        |
| Secret   | `CLOUDFLARE_API_TOKEN`            | API token with Pages Edit permission for that account |

Create a Cloudflare Pages project for direct uploads before enabling publishing. Leave `MIDSCENE_PAGES_PROJECT` unset to keep reports only as GitHub artifacts. Reports contain the synthetic test diagrams and screenshots and are publicly accessible when published to Pages.

After both successful and failed test runs, the workflow preserves reports for 14 days and publishes the generated HTML report when Pages is configured. The job's **Summary** contains a direct interactive report link and an artifact download link. Each deployment uses a run-specific preview branch so previous report URLs remain available. A publishing failure leaves the job failed and does not hide a failing test result.
