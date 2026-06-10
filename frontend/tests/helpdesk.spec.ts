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
    await expect(page.getByText('Zu schliessendes Ticket')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('close-ticket').first().click();
    await expect(page.getByText('Geschlossen').first()).toBeVisible({ timeout: 5000 });
  });

  test('KI-Analyse-Button ist bei offenem Ticket sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Analyse Test Ticket');
    await page.getByTestId('ticket-description').fill('Produktionsserver reagiert nicht mehr');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('analyze-button').first()).toBeVisible({ timeout: 5000 });
  });

  test('KI-Analyse zeigt Ergebnis', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('KI Test Ticket');
    await page.getByTestId('ticket-description').fill('Passwort vergessen, Zugang gesperrt');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('analyze-button').first()).toBeVisible({ timeout: 5000 });
    await page.getByTestId('analyze-button').first().click();
    await expect(page.getByTestId('ai-suggestion').first()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// AGSDLC-3: Tests für Ticket-Erstellung mit Pflichtfeldern, Validierung,
//            Bestätigungsmeldung und Verwerfen-Dialog
// ---------------------------------------------------------------------------

test.describe('AGSDLC-3: Ticket-Erstellung', () => {

  test('Formular enthält alle Pflichtfelder (Titel, Beschreibung, Typ, Priorität)', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('ticket-title')).toBeVisible();
    await expect(page.getByTestId('ticket-description')).toBeVisible();
    await expect(page.getByTestId('ticket-type')).toBeVisible();
    await expect(page.getByTestId('ticket-priority')).toBeVisible();
    await expect(page.getByTestId('ticket-submit')).toBeVisible();
  });

  test('Ticket mit allen Pflichtfeldern erstellen und Bestätigungsmeldung mit ID prüfen', async ({ page }) => {
    await page.goto(BASE);

    // Alle Pflichtfelder ausfüllen
    await page.getByTestId('ticket-title').fill('Vollständiges Ticket');
    await page.getByTestId('ticket-description').fill('Beschreibung des vollständigen Tickets');
    await page.getByTestId('ticket-type').selectOption('bug');
    await page.getByTestId('ticket-priority').selectOption('high');

    await page.getByTestId('ticket-submit').click();

    // Bestätigungsmeldung mit Ticket-ID erscheint
    const successMsg = page.getByTestId('ticket-success');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
    await expect(successMsg).toContainText('Ticket #');

    // Ticket erscheint in der Liste
    await expect(page.getByText('Vollständiges Ticket')).toBeVisible({ timeout: 5000 });
  });

  test('Typ-Dropdown enthält Task, Bug und Story', async ({ page }) => {
    await page.goto(BASE);
    const select = page.getByTestId('ticket-type');
    await expect(select.locator('option[value="task"]')).toHaveCount(1);
    await expect(select.locator('option[value="bug"]')).toHaveCount(1);
    await expect(select.locator('option[value="story"]')).toHaveCount(1);
  });

  test('Priorität-Dropdown enthält low, medium, high, critical', async ({ page }) => {
    await page.goto(BASE);
    const select = page.getByTestId('ticket-priority');
    await expect(select.locator('option[value="low"]')).toHaveCount(1);
    await expect(select.locator('option[value="medium"]')).toHaveCount(1);
    await expect(select.locator('option[value="high"]')).toHaveCount(1);
    await expect(select.locator('option[value="critical"]')).toHaveCount(1);
  });

  test('Pflichtfeld-Validierung: leerer Titel zeigt Fehlermeldung', async ({ page }) => {
    await page.goto(BASE);

    // Nur Beschreibung ausfüllen, Titel leer lassen
    await page.getByTestId('ticket-description').fill('Nur Beschreibung');
    await page.getByTestId('ticket-submit').click();

    // Fehlermeldung für Titel erscheint
    await expect(page.getByTestId('error-title')).toBeVisible();
    // Kein Ticket in der Liste
    await expect(page.getByTestId('ticket-success')).not.toBeVisible();
  });

  test('Pflichtfeld-Validierung: leere Beschreibung zeigt Fehlermeldung', async ({ page }) => {
    await page.goto(BASE);

    // Nur Titel ausfüllen, Beschreibung leer lassen
    await page.getByTestId('ticket-title').fill('Nur Titel');
    await page.getByTestId('ticket-submit').click();

    // Fehlermeldung für Beschreibung erscheint
    await expect(page.getByTestId('error-description')).toBeVisible();
    await expect(page.getByTestId('ticket-success')).not.toBeVisible();
  });

  test('Pflichtfeld-Validierung: alle Felder leer zeigt alle Fehlermeldungen', async ({ page }) => {
    await page.goto(BASE);

    // Direkt auf Speichern klicken ohne Eingaben
    await page.getByTestId('ticket-submit').click();

    // Fehlermeldungen für Titel und Beschreibung erscheinen
    await expect(page.getByTestId('error-title')).toBeVisible();
    await expect(page.getByTestId('error-description')).toBeVisible();
  });

  test('Fehler verschwindet nach Eingabe des fehlenden Felds', async ({ page }) => {
    await page.goto(BASE);

    // Submit ohne Titel
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('error-title')).toBeVisible();

    // Titel eingeben → Fehler verschwindet
    await page.getByTestId('ticket-title').fill('Jetzt ausgefüllt');
    await expect(page.getByTestId('error-title')).not.toBeVisible();
  });

  test('Formular wird nach erfolgreichem Erstellen zurückgesetzt', async ({ page }) => {
    await page.goto(BASE);

    await page.getByTestId('ticket-title').fill('Reset-Test Ticket');
    await page.getByTestId('ticket-description').fill('Wird nach Submit geleert');
    await page.getByTestId('ticket-submit').click();

    // Warten bis Erfolgsmeldung erscheint
    await expect(page.getByTestId('ticket-success')).toBeVisible({ timeout: 5000 });

    // Formularfelder sind leer
    await expect(page.getByTestId('ticket-title')).toHaveValue('');
    await expect(page.getByTestId('ticket-description')).toHaveValue('');
  });

  test('Ticket-Typ-Badge wird in der Liste angezeigt', async ({ page }) => {
    await page.goto(BASE);

    await page.getByTestId('ticket-title').fill('Bug-Ticket Anzeige');
    await page.getByTestId('ticket-description').fill('Zeigt Bug-Badge');
    await page.getByTestId('ticket-type').selectOption('bug');
    await page.getByTestId('ticket-priority').selectOption('critical');
    await page.getByTestId('ticket-submit').click();

    await expect(page.getByText('Bug-Ticket Anzeige')).toBeVisible({ timeout: 5000 });
    // Bug-Badge erscheint in der Ticket-Liste
    await expect(page.getByTestId('ticket-type-badge').first()).toBeVisible();
    await expect(page.getByTestId('ticket-type-badge').first()).toContainText('Bug');
  });

  test('Verwerfen-Button ist sichtbar wenn Formular ausgefüllt', async ({ page }) => {
    await page.goto(BASE);

    // Verwerfen-Button ist initial deaktiviert (Formular leer)
    const discardBtn = page.getByTestId('ticket-discard');
    await expect(discardBtn).toBeDisabled();

    // Nach Eingabe wird Verwerfen aktiv
    await page.getByTestId('ticket-title').fill('Etwas eingegeben');
    await expect(discardBtn).toBeEnabled();
  });

  test('Verwerfen-Dialog erscheint und leert bei Bestätigung das Formular', async ({ page }) => {
    await page.goto(BASE);

    await page.getByTestId('ticket-title').fill('Wird verworfen');
    await page.getByTestId('ticket-description').fill('Diese Eingabe wird verworfen');

    // Dialog akzeptieren (confirm = true)
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByTestId('ticket-discard').click();

    // Formular ist leer
    await expect(page.getByTestId('ticket-title')).toHaveValue('');
    await expect(page.getByTestId('ticket-description')).toHaveValue('');
  });

  test('Verwerfen-Dialog: Abbrechen behält Eingaben', async ({ page }) => {
    await page.goto(BASE);

    await page.getByTestId('ticket-title').fill('Bleibt erhalten');
    await page.getByTestId('ticket-description').fill('Wird nicht verworfen');

    // Dialog ablehnen (confirm = false)
    page.on('dialog', (dialog) => dialog.dismiss());
    await page.getByTestId('ticket-discard').click();

    // Formular enthält noch die Eingaben
    await expect(page.getByTestId('ticket-title')).toHaveValue('Bleibt erhalten');
    await expect(page.getByTestId('ticket-description')).toHaveValue('Wird nicht verworfen');
  });

  test('Story-Ticket mit niedriger Priorität erscheint in der Liste', async ({ page }) => {
    await page.goto(BASE);

    await page.getByTestId('ticket-title').fill('User Story Test');
    await page.getByTestId('ticket-description').fill('Als Nutzer möchte ich...');
    await page.getByTestId('ticket-type').selectOption('story');
    await page.getByTestId('ticket-priority').selectOption('low');
    await page.getByTestId('ticket-submit').click();

    await expect(page.getByText('User Story Test')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('ticket-type-badge').first()).toContainText('Story');
  });
});
