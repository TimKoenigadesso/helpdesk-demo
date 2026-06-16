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
    await page.getByTestId('ticket-requester-name').fill('Max Mustermann');
    await page.getByTestId('ticket-title').fill('E2E Test Ticket');
    await page.getByTestId('ticket-description').fill('Beschreibung vom Playwright Test');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByText('E2E Test Ticket')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('[open]')).toBeVisible();
  });

  test('Ticket schliessen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-requester-name').fill('Erika Musterfrau');
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
    await page.getByTestId('ticket-requester-name').fill('Hans Schmidt');
    await page.getByTestId('ticket-title').fill('Analyse Test Ticket');
    await page.getByTestId('ticket-description').fill('Produktionsserver reagiert nicht mehr');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Analyse Test Ticket' });
    await expect(ticketItem.getByTestId('analyze-button')).toBeVisible({ timeout: 5000 });
  });

  test('KI-Analyse zeigt Ergebnis', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-requester-name').fill('Anna Müller');
    await page.getByTestId('ticket-title').fill('KI Test Ticket');
    await page.getByTestId('ticket-description').fill('Passwort vergessen, Zugang gesperrt');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'KI Test Ticket' });
    await expect(ticketItem.getByTestId('analyze-button')).toBeVisible({ timeout: 5000 });
    await ticketItem.getByTestId('analyze-button').click();
    await expect(ticketItem.getByTestId('ai-suggestion')).toBeVisible({ timeout: 10000 });
  });

  // ── AGSDLC-18: Name & Priorität bei Anfrage ──────────────────────────────

  test('AGSDLC-18: Name-Feld ist sichtbar und Pflichtfeld', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('ticket-requester-name')).toBeVisible();
    // Formular ohne Namen absenden → Fehlermeldung erscheint
    await page.getByTestId('ticket-title').fill('Ticket ohne Namen');
    await page.getByTestId('ticket-description').fill('Test Beschreibung');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('name-error')).toBeVisible({ timeout: 3000 });
  });

  test('AGSDLC-18: Prioritäts-Dropdown ist sichtbar mit Standardwert Mittel', async ({ page }) => {
    await page.goto(BASE);
    const select = page.getByTestId('ticket-priority');
    await expect(select).toBeVisible();
    // Standardwert ist "medium"
    await expect(select).toHaveValue('medium');
  });

  test('AGSDLC-18: Alle Prioritätsstufen sind wählbar', async ({ page }) => {
    await page.goto(BASE);
    const select = page.getByTestId('ticket-priority');
    for (const prio of ['low', 'medium', 'high', 'critical']) {
      await select.selectOption(prio);
      await expect(select).toHaveValue(prio);
    }
  });

  test('AGSDLC-18: Ticket mit Name und Priorität wird korrekt erstellt', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-requester-name').fill('Maria Musterfrau');
    await page.getByTestId('ticket-title').fill('AGSDLC-18 Ticket');
    await page.getByTestId('ticket-description').fill('Ticket mit Name und Priorität');
    await page.getByTestId('ticket-priority').selectOption('high');
    await page.getByTestId('ticket-submit').click();

    // Ticket erscheint in der Liste
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'AGSDLC-18 Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });

    // Name wird im Ticket angezeigt
    await expect(ticketItem.getByTestId('ticket-requester-name-display')).toBeVisible({ timeout: 3000 });
    await expect(ticketItem.getByTestId('ticket-requester-name-display')).toContainText('Maria Musterfrau');

    // Priorität "Hoch" als Badge sichtbar
    await expect(ticketItem.getByText('Hoch')).toBeVisible({ timeout: 3000 });
  });

  test('AGSDLC-18: Formular ohne Namen zeigt Validierungsfehler, kein Submit', async ({ page }) => {
    await page.goto(BASE);
    const initialCount = await page.getByTestId('ticket-item').count();

    await page.getByTestId('ticket-title').fill('Test ohne Namen');
    await page.getByTestId('ticket-description').fill('Keine Namenseingabe');
    await page.getByTestId('ticket-submit').click();

    // Fehlermeldung sichtbar
    await expect(page.getByTestId('name-error')).toBeVisible({ timeout: 3000 });

    // Ticket wurde NICHT erstellt (Anzahl bleibt gleich)
    await page.waitForTimeout(1000);
    const newCount = await page.getByTestId('ticket-item').count();
    expect(newCount).toBe(initialCount);
  });

  test('AGSDLC-18: Standardpriorität Mittel wird gesetzt wenn keine Auswahl', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-requester-name').fill('Karl Standardmann');
    await page.getByTestId('ticket-title').fill('Standard-Prio Ticket');
    await page.getByTestId('ticket-description').fill('Priorität nicht geändert');
    // Priorität NICHT ändern → bleibt bei "medium"
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Standard-Prio Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // "Mittel" Badge sichtbar
    await expect(ticketItem.getByText('Mittel')).toBeVisible({ timeout: 3000 });
  });

  test('AGSDLC-18: Priorität Kritisch wird als Badge angezeigt', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-requester-name').fill('Ernst Urgent');
    await page.getByTestId('ticket-title').fill('Kritisches Ticket');
    await page.getByTestId('ticket-description').fill('Sehr dringend!');
    await page.getByTestId('ticket-priority').selectOption('critical');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Kritisches Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByText('Kritisch')).toBeVisible({ timeout: 3000 });
  });
});
