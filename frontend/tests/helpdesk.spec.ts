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

  // ── AGSDLC-17: reporter_name Tests ───────────────────────────────────────

  test('Namensfeld ist im Meldeformular sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('reporter-name')).toBeVisible();
  });

  test('Namensfeld hat korrekten Placeholder-Text', async ({ page }) => {
    await page.goto(BASE);
    const nameInput = page.getByTestId('reporter-name');
    await expect(nameInput).toHaveAttribute('placeholder', /Name/i);
  });

  test('Ticket mit Name erstellen und Name in Übersicht anzeigen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Ticket mit Melder');
    await page.getByTestId('ticket-description').fill('Dieses Ticket hat einen Melder');
    await page.getByTestId('reporter-name').fill('Max Mustermann');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Ticket mit Melder' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByTestId('reporter-name-display')).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByTestId('reporter-name-value')).toHaveText('Max Mustermann');
  });

  test('Ticket ohne Name erstellen zeigt kein Namensfeld in der Liste', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Anonymes Ticket E2E');
    await page.getByTestId('ticket-description').fill('Kein Name angegeben');
    // reporter-name bleibt leer
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Anonymes Ticket E2E' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // reporter-name-display soll nicht vorhanden sein
    await expect(ticketItem.getByTestId('reporter-name-display')).not.toBeVisible();
  });

  test('Namensfeld wird nach Absenden geleert', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Reset-Test Ticket');
    await page.getByTestId('ticket-description').fill('Formular-Reset prüfen');
    await page.getByTestId('reporter-name').fill('Erika Musterfrau');
    await page.getByTestId('ticket-submit').click();

    // Nach dem Submit sollten alle Felder geleert sein
    await expect(page.getByTestId('ticket-title')).toHaveValue('', { timeout: 5000 });
    await expect(page.getByTestId('reporter-name')).toHaveValue('');
  });

  test('Name mit mehr als 100 Zeichen wird im Frontend abgelehnt', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Langen-Namen Test');
    await page.getByTestId('ticket-description').fill('Name zu lang');

    // maxLength=100 verhindert Eingabe über 100 Zeichen direkt
    const nameInput = page.getByTestId('reporter-name');
    await expect(nameInput).toHaveAttribute('maxlength', '100');
  });

  test('Name in Detailansicht (Admin-Modus) sichtbar', async ({ page }) => {
    await page.goto(BASE);
    // Ticket mit Name erstellen
    await page.getByTestId('ticket-title').fill('Admin-Ansicht Ticket');
    await page.getByTestId('ticket-description').fill('Für Admin-Ansicht');
    await page.getByTestId('reporter-name').fill('Anna Admin');
    await page.getByTestId('ticket-submit').click();

    // In Admin-Ansicht wechseln
    await page.getByText('🔧 IT-Admin').click();

    const adminTicket = page.getByTestId('ticket-item').filter({ hasText: 'Admin-Ansicht Ticket' });
    await expect(adminTicket).toBeVisible({ timeout: 5000 });
    await expect(adminTicket.getByTestId('reporter-name-display')).toBeVisible({ timeout: 5000 });
    await expect(adminTicket.getByTestId('reporter-name-value')).toHaveText('Anna Admin');
  });
});
