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

  // --- DMBRD-14: Manuelle Prioritaetsaenderung ---

  test('Prioritaets-Badge ist in der Ticketliste sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Badge Test');
    await page.getByTestId('ticket-description').fill('Prioritaet anzeigen');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('ticket-item').first()).toBeVisible({ timeout: 5000 });
    // PriorityBadge oder PrioritySelector zeigt den Badge an
    await expect(page.getByTestId('priority-badge').first()).toBeVisible({ timeout: 5000 });
  });

  test('Prioritaet bearbeiten – Editor oeffnet sich per Klick auf Bleistift-Icon', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Edit Test');
    await page.getByTestId('ticket-description').fill('Prioritaet editieren');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('priority-edit-btn').first()).toBeVisible({ timeout: 5000 });

    await page.getByTestId('priority-edit-btn').first().click();

    // Dropdown und Buttons erscheinen
    await expect(page.getByTestId('priority-select').first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('priority-save').first()).toBeVisible();
    await expect(page.getByTestId('priority-cancel').first()).toBeVisible();
  });

  test('Prioritaet auf Hoch aendern und speichern', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Speichern Test');
    await page.getByTestId('ticket-description').fill('Prioritaet wird auf Hoch gesetzt');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('priority-edit-btn').first()).toBeVisible({ timeout: 5000 });

    // Bearbeitungsmodus oeffnen
    await page.getByTestId('priority-edit-btn').first().click();
    await expect(page.getByTestId('priority-select').first()).toBeVisible({ timeout: 3000 });

    // Prioritaet auf "high" setzen
    await page.getByTestId('priority-select').first().selectOption('high');

    // Speichern
    await page.getByTestId('priority-save').first().click();

    // Editor schliesst sich, Badge zeigt neuen Wert
    await expect(page.getByTestId('priority-badge').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('priority-badge').first()).toContainText('Hoch');
  });

  test('Prioritaet aendern und Abbrechen zeigt Bestaetigungsdialog', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Abbrechen Test');
    await page.getByTestId('ticket-description').fill('Abbruch mit Dialog');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('priority-edit-btn').first()).toBeVisible({ timeout: 5000 });

    // Bearbeitungsmodus oeffnen
    await page.getByTestId('priority-edit-btn').first().click();
    await expect(page.getByTestId('priority-select').first()).toBeVisible({ timeout: 3000 });

    // Prioritaet aendern (ohne Speichern)
    await page.getByTestId('priority-select').first().selectOption('critical');

    // Bestaetigungsdialog abfangen und abbrechen (Cancel → Dialog wird angezeigt)
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('ungespeicherte');
      await dialog.dismiss(); // Abbrechen klicken → Aenderung wird NICHT verworfen
    });

    await page.getByTestId('priority-cancel').first().click();

    // Dropdown bleibt noch sichtbar (Nutzer hat Abbruch verweigert)
    await expect(page.getByTestId('priority-select').first()).toBeVisible({ timeout: 2000 });
  });

  test('Prioritaet aendern und Bestaetigungsdialog bestaetigen verwirft Aenderung', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Verwerfen Test');
    await page.getByTestId('ticket-description').fill('Aenderung wird verworfen');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('priority-edit-btn').first()).toBeVisible({ timeout: 5000 });

    // Editor oeffnen
    await page.getByTestId('priority-edit-btn').first().click();
    await expect(page.getByTestId('priority-select').first()).toBeVisible({ timeout: 3000 });

    // Prioritaet aendern (ohne zu speichern)
    await page.getByTestId('priority-select').first().selectOption('critical');

    // Bestaetigungsdialog bestaetigen → Aenderung wird verworfen
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.getByTestId('priority-cancel').first().click();

    // Editor ist geschlossen, Badge zeigt wieder alten Wert (medium)
    await expect(page.getByTestId('priority-badge').first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('priority-badge').first()).toContainText('Mittel');
  });

  test('Abbrechen ohne Aenderung zeigt keinen Dialog', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Prio Kein Dialog Test');
    await page.getByTestId('ticket-description').fill('Kein Dialog ohne Aenderung');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('priority-edit-btn').first()).toBeVisible({ timeout: 5000 });

    // Editor oeffnen
    await page.getByTestId('priority-edit-btn').first().click();
    await expect(page.getByTestId('priority-select').first()).toBeVisible({ timeout: 3000 });

    // Ohne Aenderung sofort abbrechen – kein Dialog erwartet
    let dialogShown = false;
    page.once('dialog', () => { dialogShown = true; });

    await page.getByTestId('priority-cancel').first().click();

    // Editor sollte geschlossen sein
    await expect(page.getByTestId('priority-badge').first()).toBeVisible({ timeout: 3000 });
    expect(dialogShown).toBe(false);
  });
});
