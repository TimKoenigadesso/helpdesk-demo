import { test, expect } from '@playwright/test';

const BASE = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';

test.describe('Helpdesk App', () => {
  test('Startseite lädt korrekt', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByText('Helpdesk Demo')).toBeVisible();
    await expect(page.getByTestId('ticket-title')).toBeVisible();
    await expect(page.getByTestId('ticket-submit')).toBeVisible();
  });

  test('Ticket erstellen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('E2E Test Ticket');
    await page.getByTestId('ticket-description').fill('Beschreibung vom Playwright Test');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByText('E2E Test Ticket')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('[open]')).toBeVisible();
  });

  test('Ticket schliessen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Zu schliessendes Ticket');
    await page.getByTestId('ticket-description').fill('Wird geschlossen');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Zu schliessendes Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await ticketItem.getByTestId('close-ticket').click();
    await expect(ticketItem.getByText('Geschlossen')).toBeVisible({ timeout: 5000 });
  });

  test('KI-Analyse-Button ist bei offenem Ticket sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Analyse Test Ticket');
    await page.getByTestId('ticket-description').fill('Produktionsserver reagiert nicht mehr');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Analyse Test Ticket' });
    await expect(ticketItem.getByTestId('analyze-button')).toBeVisible({ timeout: 5000 });
  });

  test('KI-Analyse zeigt Ergebnis', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('KI Test Ticket');
    await page.getByTestId('ticket-description').fill('Passwort vergessen, Zugang gesperrt');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'KI Test Ticket' });
    await expect(ticketItem.getByTestId('analyze-button')).toBeVisible({ timeout: 5000 });
    await ticketItem.getByTestId('analyze-button').click();
    await expect(ticketItem.getByTestId('ai-suggestion')).toBeVisible({ timeout: 10000 });
  });

  // ── AGSDLC-5: Prioritätsfeld im Melde-Formular ────────────────────────────

  test('Prioritäts-Dropdown ist im Formular sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('ticket-priority')).toBeVisible();
  });

  test('Prioritäts-Dropdown hat Standardwert "medium"', async ({ page }) => {
    await page.goto(BASE);
    const select = page.getByTestId('ticket-priority');
    await expect(select).toHaveValue('medium');
  });

  test('Alle vier Prioritätswerte sind als Optionen vorhanden', async ({ page }) => {
    await page.goto(BASE);
    const select = page.getByTestId('ticket-priority');
    for (const value of ['low', 'medium', 'high', 'critical']) {
      await expect(select.locator(`option[value="${value}"]`)).toHaveCount(1);
    }
  });

  test('Ticket mit Priorität "low" erstellen und in der Liste anzeigen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Niedrig E2E');
    await page.getByTestId('ticket-description').fill('Test mit niedriger Priorität');
    await page.getByTestId('ticket-priority').selectOption('low');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Prio Niedrig E2E' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // PriorityBadge zeigt "Niedrig"
    await expect(ticketItem.getByText('Niedrig')).toBeVisible();
  });

  test('Ticket mit Priorität "critical" erstellen und in der Liste anzeigen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Kritisch E2E');
    await page.getByTestId('ticket-description').fill('Test mit kritischer Priorität');
    await page.getByTestId('ticket-priority').selectOption('critical');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Prio Kritisch E2E' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // PriorityBadge zeigt "Kritisch"
    await expect(ticketItem.getByText('Kritisch')).toBeVisible();
  });

  test('Ticket mit Priorität "high" erstellen und in der Liste anzeigen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Hoch E2E');
    await page.getByTestId('ticket-description').fill('Test mit hoher Priorität');
    await page.getByTestId('ticket-priority').selectOption('high');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Prio Hoch E2E' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // PriorityBadge zeigt "Hoch"
    await expect(ticketItem.getByText('Hoch')).toBeVisible();
  });

  test('Priorität bleibt nach Formular-Reset auf Standardwert "medium"', async ({ page }) => {
    await page.goto(BASE);
    const select = page.getByTestId('ticket-priority');

    // Priorität auf "critical" setzen
    await select.selectOption('critical');
    await expect(select).toHaveValue('critical');

    // Ticket absenden → Formular zurücksetzen
    await page.getByTestId('ticket-title').fill('Reset Prio Test');
    await page.getByTestId('ticket-description').fill('Formular-Reset prüfen');
    await page.getByTestId('ticket-submit').click();

    // Nach dem Absenden soll der Dropdown wieder auf "medium" stehen
    await expect(select).toHaveValue('medium', { timeout: 5000 });
  });

  test('Prioritäts-Dropdown ist nach Ticket-Erstellung wieder auf "medium" zurückgesetzt', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Dropdown Reset Test');
    await page.getByTestId('ticket-description').fill('Wird zurückgesetzt');
    await page.getByTestId('ticket-priority').selectOption('high');
    await page.getByTestId('ticket-submit').click();
    // Erfolgsmeldung abwarten (Formular wurde verarbeitet)
    await expect(page.getByText('✓ Ticket erstellt')).toBeVisible({ timeout: 5000 });
    // Dropdown muss wieder auf Standardwert stehen
    await expect(page.getByTestId('ticket-priority')).toHaveValue('medium');
  });
});
