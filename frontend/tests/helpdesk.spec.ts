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
    // Status-Badge "Offen" prüfen (statt rohem "[open]" String)
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'E2E Test Ticket' });
    await expect(ticketItem.getByTestId('ticket-status-badge')).toHaveText('Offen');
  });

  test('Ticket schliessen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Zu schliessendes Ticket');
    await page.getByTestId('ticket-description').fill('Wird geschlossen');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Zu schliessendes Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await ticketItem.getByTestId('close-ticket').click();
    await expect(ticketItem.getByTestId('ticket-status-badge')).toHaveText('Geschlossen', { timeout: 5000 });
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

  // ── Kommentar-Tests ──────────────────────────────────────────────────────

  test('Kommentar-Bereich ist standardmäßig eingeklappt', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Kommentar Toggle Test');
    await page.getByTestId('ticket-description').fill('Beschreibung für Kommentar-Test');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Kommentar Toggle Test' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // Toggle-Button sichtbar, aber Kommentarliste noch nicht
    await expect(ticketItem.getByTestId('comment-toggle')).toBeVisible();
    await expect(ticketItem.getByTestId('comment-list')).not.toBeVisible();
  });

  test('Kommentar-Bereich öffnen und "Noch keine Kommentare" sehen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Kommentar Leer Test');
    await page.getByTestId('ticket-description').fill('Kein Kommentar vorhanden');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Kommentar Leer Test' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await ticketItem.getByTestId('comment-toggle').click();
    await expect(ticketItem.getByTestId('comment-list')).toBeVisible({ timeout: 3000 });
    await expect(ticketItem.getByTestId('no-comments')).toBeVisible();
  });

  test('Kommentar erstellen und anzeigen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Kommentar Erstellen Test');
    await page.getByTestId('ticket-description').fill('Dieser Ticket bekommt einen Kommentar');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Kommentar Erstellen Test' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });

    // Kommentar-Bereich öffnen
    await ticketItem.getByTestId('comment-toggle').click();
    await expect(ticketItem.getByTestId('comment-list')).toBeVisible({ timeout: 3000 });

    // Kommentar eingeben und absenden
    await ticketItem.getByTestId('comment-input').fill('Das ist mein erster Kommentar!');
    await ticketItem.getByTestId('comment-submit').click();

    // Kommentar erscheint in der Liste
    await expect(ticketItem.getByTestId('comment-item').first()).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByTestId('comment-body').first()).toHaveText('Das ist mein erster Kommentar!');
    await expect(ticketItem.getByTestId('comment-author').first()).toContainText('Mitarbeiter');
  });

  test('Kommentar-Zähler im Toggle-Button erscheint nach Kommentar', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Zähler Test Ticket');
    await page.getByTestId('ticket-description').fill('Test für Kommentar-Zähler');
    await page.getByTestId('ticket-submit').click();
    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Zähler Test Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });

    // Kommentar-Bereich öffnen, Kommentar hinzufügen
    await ticketItem.getByTestId('comment-toggle').click();
    await ticketItem.getByTestId('comment-input').fill('Kommentar für Zähler-Test');
    await ticketItem.getByTestId('comment-submit').click();
    await expect(ticketItem.getByTestId('comment-item').first()).toBeVisible({ timeout: 5000 });

    // Bereich schließen — Zähler-Badge soll sichtbar sein
    await ticketItem.getByTestId('comment-toggle').click();
    await expect(ticketItem.getByTestId('comment-list')).not.toBeVisible();
    // Der Toggle-Button zeigt nun die Anzahl
    await expect(ticketItem.getByTestId('comment-toggle')).toContainText('1');
  });

  // ── Prioritäts-Feature-Tests (AGSDLC-6) ────────────────────────────────────

  test('Prioritäts-Dropdown ist im Formular sichtbar und hat Standardwert Mittel', async ({ page }) => {
    await page.goto(BASE);
    const prioritySelect = page.getByTestId('ticket-priority');
    await expect(prioritySelect).toBeVisible();
    await expect(prioritySelect).toHaveValue('medium');
  });

  test('Alle vier Prioritätsstufen sind im Dropdown wählbar', async ({ page }) => {
    await page.goto(BASE);
    const prioritySelect = page.getByTestId('ticket-priority');
    await expect(prioritySelect.locator('option[value="low"]')).toHaveText('Niedrig');
    await expect(prioritySelect.locator('option[value="medium"]')).toHaveText('Mittel');
    await expect(prioritySelect.locator('option[value="high"]')).toHaveText('Hoch');
    await expect(prioritySelect.locator('option[value="critical"]')).toHaveText('Kritisch');
  });

  test('Ticket mit Priorität Hoch erstellen und Badge prüfen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Hoch-Prio Ticket');
    await page.getByTestId('ticket-description').fill('Dringend, bitte schnell');
    await page.getByTestId('ticket-priority').selectOption('high');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Hoch-Prio Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // PriorityBadge zeigt "Hoch"
    await expect(ticketItem.getByText('Hoch')).toBeVisible();
  });

  test('Ticket mit Priorität Niedrig erstellen und Badge prüfen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Niedrig-Prio Ticket');
    await page.getByTestId('ticket-description').fill('Keine Eile');
    await page.getByTestId('ticket-priority').selectOption('low');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Niedrig-Prio Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByText('Niedrig')).toBeVisible();
  });

  test('Ticket mit Priorität Kritisch wird visuell hervorgehoben', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Kritisches Ticket');
    await page.getByTestId('ticket-description').fill('Server down, alles kaputt');
    await page.getByTestId('ticket-priority').selectOption('critical');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Kritisches Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // Kritisch-Banner sichtbar
    await expect(ticketItem.getByTestId('critical-banner')).toBeVisible();
    // PriorityBadge zeigt "Kritisch"
    await expect(ticketItem.getByText('Kritisch')).toBeVisible();
  });

  test('Ohne manuelle Auswahl wird Priorität Mittel gesetzt', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Default Prio Ticket');
    await page.getByTestId('ticket-description').fill('Keine Priorität gewählt');
    // Kein selectOption → bleibt auf medium
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Default Prio Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByText('Mittel')).toBeVisible();
  });

  // ── Reporter-Name-Tests (AGSDLC-17) ──────────────────────────────────────

  test('Namensfeld ist im Formular sichtbar und optional', async ({ page }) => {
    await page.goto(BASE);
    const nameInput = page.getByTestId('reporter-name');
    await expect(nameInput).toBeVisible();
    // Label zeigt "(optional)"
    await expect(page.getByText('Ihr Name')).toBeVisible();
    // Formular kann ohne Namen abgeschickt werden
    await page.getByTestId('ticket-title').fill('Ticket ohne Namen');
    await page.getByTestId('ticket-description').fill('Beschreibung ohne Namensangabe');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('ticket-item').filter({ hasText: 'Ticket ohne Namen' })).toBeVisible({ timeout: 5000 });
  });

  test('Ticket mit Namen erstellen und Name in Übersicht anzeigen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Ticket mit Melder-Name');
    await page.getByTestId('ticket-description').fill('Beschreibung mit Name');
    await page.getByTestId('reporter-name').fill('Max Mustermann');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Ticket mit Melder-Name' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // Name wird in der Ticket-Karte angezeigt
    await expect(ticketItem.getByTestId('reporter-name-display')).toBeVisible();
    await expect(ticketItem.getByTestId('reporter-name-display')).toContainText('Max Mustermann');
  });

  test('Namensfeld wird nach Absenden geleert', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Reset Name Ticket');
    await page.getByTestId('ticket-description').fill('Feldwert wird nach Submit geleert');
    await page.getByTestId('reporter-name').fill('Erika Musterfrau');
    await page.getByTestId('ticket-submit').click();
    // Nach erfolgreichem Absenden ist das Namensfeld leer
    await expect(page.getByTestId('reporter-name')).toHaveValue('', { timeout: 5000 });
  });

  test('Validierungsfehler bei Name über 100 Zeichen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Zu langer Name');
    await page.getByTestId('ticket-description').fill('Beschreibung');
    // 101 Zeichen im Namensfeld eingeben (maxLength=100 im input verhindert das direkt via UI,
    // daher via evaluate um den Wert programmatisch zu setzen und HTML-Validierung zu umgehen)
    await page.getByTestId('reporter-name').evaluate((el: HTMLInputElement) => {
      el.removeAttribute('maxlength');
    });
    await page.getByTestId('reporter-name').fill('A'.repeat(101));
    await page.getByTestId('ticket-submit').click();
    // Fehlermeldung sichtbar
    await expect(page.getByTestId('reporter-name-error')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('reporter-name-error')).toContainText('100 Zeichen');
  });

  test('Ticket ohne Namen zeigt keinen Melder-Bereich', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Anonym Ticket');
    await page.getByTestId('ticket-description').fill('Kein Name angegeben');
    // reporter-name leer lassen
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Anonym Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    // reporter-name-display darf nicht sichtbar sein
    await expect(ticketItem.getByTestId('reporter-name-display')).not.toBeVisible();
  });

  test('Admin kann Kommentar löschen', async ({ page }) => {
    await page.goto(BASE);

    // Admin-Ansicht wechseln
    await page.getByText('🔧 IT-Admin').click();

    // Warte auf Admin-Dashboard
    await expect(page.getByText('IT-Admin Dashboard')).toBeVisible({ timeout: 5000 });

    // Erstes vorhandenes Ticket im Admin-Bereich
    const ticketItem = page.getByTestId('ticket-item').first();
    await expect(ticketItem).toBeVisible({ timeout: 5000 });

    // Kommentar-Bereich öffnen
    await ticketItem.getByTestId('comment-toggle').click();
    await expect(ticketItem.getByTestId('comment-list')).toBeVisible({ timeout: 3000 });

    // Kommentar hinzufügen (als Admin-Route)
    await ticketItem.getByTestId('comment-input').fill('Admin-Notiz zum Löschen');
    await ticketItem.getByTestId('comment-submit').click();
    await expect(ticketItem.getByTestId('comment-item').first()).toBeVisible({ timeout: 5000 });

    // Löschen-Button klicken
    await ticketItem.getByTestId('comment-delete').first().click();

    // Kommentar ist weg
    await expect(ticketItem.getByTestId('no-comments')).toBeVisible({ timeout: 5000 });
  });
});
