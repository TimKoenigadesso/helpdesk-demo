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

  // ── Vorname/Nachname + Priorität Feature-Tests (AGSDLC-20) ─────────────────

  test('Vorname- und Nachname-Felder sind im Formular sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('ticket-first-name')).toBeVisible();
    await expect(page.getByTestId('ticket-last-name')).toBeVisible();
  });

  test('Ticket mit Vor- und Nachname erstellen und in der Liste anzeigen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Name Test Ticket');
    await page.getByTestId('ticket-description').fill('Beschreibung mit Name');
    await page.getByTestId('ticket-first-name').fill('Anna');
    await page.getByTestId('ticket-last-name').fill('Müller');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Name Test Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByTestId('ticket-first-name-display')).toHaveText('Anna');
    await expect(ticketItem.getByTestId('ticket-last-name-display')).toHaveText('Müller');
  });

  test('Ticket ohne Namen erstellen — kein Submitter-Bereich sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Anonym Test Ticket');
    await page.getByTestId('ticket-description').fill('Kein Name angegeben');
    // Kein Name → kein Eintrag in den Feldern
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Anonym Test Ticket' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByTestId('ticket-submitter')).not.toBeVisible();
  });

  test('Ticket mit Priorität Kritisch und Name erstellen', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Kritisch mit Name');
    await page.getByTestId('ticket-description').fill('Server down, Kontakt: Max Mustermann');
    await page.getByTestId('ticket-first-name').fill('Max');
    await page.getByTestId('ticket-last-name').fill('Mustermann');
    await page.getByTestId('ticket-priority').selectOption('critical');
    await page.getByTestId('ticket-submit').click();

    const ticketItem = page.getByTestId('ticket-item').filter({ hasText: 'Kritisch mit Name' });
    await expect(ticketItem).toBeVisible({ timeout: 5000 });
    await expect(ticketItem.getByTestId('critical-banner')).toBeVisible();
    await expect(ticketItem.getByTestId('ticket-first-name-display')).toHaveText('Max');
    await expect(ticketItem.getByTestId('ticket-last-name-display')).toHaveText('Mustermann');
    await expect(ticketItem.getByText('Kritisch')).toBeVisible();
  });

  test('Formular-Felder werden nach dem Absenden zurückgesetzt', async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId('ticket-title').fill('Reset Felder Test');
    await page.getByTestId('ticket-description').fill('Felder sollen nach Submit leer sein');
    await page.getByTestId('ticket-first-name').fill('Hans');
    await page.getByTestId('ticket-last-name').fill('Meier');
    await page.getByTestId('ticket-submit').click();

    // Nach dem Submit sollen alle Felder leer sein
    await expect(page.getByTestId('ticket-title')).toHaveValue('', { timeout: 5000 });
    await expect(page.getByTestId('ticket-first-name')).toHaveValue('');
    await expect(page.getByTestId('ticket-last-name')).toHaveValue('');
  });

  test('Vorname-Feld hat kein required-Attribut', async ({ page }) => {
    await page.goto(BASE);
    const firstNameInput = page.getByTestId('ticket-first-name');
    await expect(firstNameInput).not.toHaveAttribute('required');
  });

  test('Nachname-Feld hat kein required-Attribut', async ({ page }) => {
    await page.goto(BASE);
    const lastNameInput = page.getByTestId('ticket-last-name');
    await expect(lastNameInput).not.toHaveAttribute('required');
  });

  // ── REWE UI-Design Tests (AGSDLC-32) ──────────────────────────────────────

  test('REWE Header ist sichtbar mit roter Navigationsleiste', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('rewe-header')).toBeVisible();
    await expect(page.getByTestId('rewe-nav')).toBeVisible();
    // Navigationsleiste hat REWE-Rot als Hintergrundfarbe
    const nav = page.getByTestId('rewe-nav');
    const bgColor = await nav.evaluate((el) => getComputedStyle(el).backgroundColor);
    // rgb(204, 7, 30) entspricht #CC071E
    expect(bgColor).toBe('rgb(204, 7, 30)');
  });

  test('REWE Navigation zeigt alle drei Menüpunkte', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('nav-maerkte')).toBeVisible();
    await expect(page.getByTestId('nav-online-bestellen')).toBeVisible();
    await expect(page.getByTestId('nav-rezepte')).toBeVisible();
    await expect(page.getByTestId('nav-maerkte')).toContainText('Märkte');
    await expect(page.getByTestId('nav-online-bestellen')).toContainText('Online bestellen');
    await expect(page.getByTestId('nav-rezepte')).toContainText('Rezepte');
  });

  test('"Online bestellen" ist farblich hervorgehoben', async ({ page }) => {
    await page.goto(BASE);
    const onlineBestellen = page.getByTestId('nav-online-bestellen');
    await expect(onlineBestellen).toBeVisible();
    // Der Link hat eine besondere Hintergrundfarbe (dunkler als der Rest)
    const bgColor = await onlineBestellen.evaluate((el) => getComputedStyle(el).backgroundColor);
    // rgb(165, 0, 22) entspricht #a50016 — dunkler als REWE-Rot
    expect(bgColor).toBe('rgb(165, 0, 22)');
  });

  test('REWE Header-Bar zeigt Logo, Suchfeld und Icons', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('rewe-header-bar')).toBeVisible();
    await expect(page.getByTestId('rewe-logo')).toBeVisible();
    await expect(page.getByTestId('rewe-search')).toBeVisible();
    await expect(page.getByTestId('rewe-search-input')).toBeVisible();
    await expect(page.getByTestId('rewe-cart-button')).toBeVisible();
  });

  test('REWE Warenkorb-Button hat REWE-Rot als Hintergrundfarbe', async ({ page }) => {
    await page.goto(BASE);
    const cartBtn = page.getByTestId('rewe-cart-button');
    await expect(cartBtn).toBeVisible();
    const bgColor = await cartBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(204, 7, 30)');
  });

  test('REWE Hero-Banner ist sichtbar mit korrektem Titel', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('rewe-hero-banner')).toBeVisible();
    await expect(page.getByTestId('rewe-hero-title')).toBeVisible();
    await expect(page.getByTestId('rewe-hero-title')).toContainText('Willkommen beim REWE Paketservice');
  });

  test('REWE Hero-Banner hat gelben Hintergrund', async ({ page }) => {
    await page.goto(BASE);
    const banner = page.getByTestId('rewe-hero-banner');
    await expect(banner).toBeVisible();
    const bgColor = await banner.evaluate((el) => getComputedStyle(el).backgroundColor);
    // rgb(255, 224, 51) entspricht #FFE033
    expect(bgColor).toBe('rgb(255, 224, 51)');
  });

  test('REWE Hero-Banner zeigt Unterzeile', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('rewe-hero-subtitle')).toBeVisible();
    await expect(page.getByTestId('rewe-hero-subtitle')).toContainText('Frische');
  });

  test('REWE Hero-Banner zeigt vier Vorteils-Badges', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('rewe-hero-badges')).toBeVisible();
    const badges = page.getByTestId('rewe-advantage-badge');
    await expect(badges).toHaveCount(4);
  });

  test('Vorteils-Badges zeigen Sortiment, Mindestbestellwert, Rücksendung und Eigenmarken', async ({ page }) => {
    await page.goto(BASE);
    const badgesContainer = page.getByTestId('rewe-hero-badges');
    await expect(badgesContainer).toContainText('Sortiment');
    await expect(badgesContainer).toContainText('Mindestbestellwert');
    await expect(badgesContainer).toContainText('Rücksendung');
    await expect(badgesContainer).toContainText('Eigenmarken');
  });

  test('REWE Kategoriekacheln sind als Grid in zwei Reihen sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('rewe-category-grid')).toBeVisible();
    await expect(page.getByTestId('rewe-category-tiles')).toBeVisible();
    // 8 Kacheln in zwei Reihen à 4 Spalten
    const tiles = page.getByTestId('rewe-category-tiles').locator('button');
    await expect(tiles).toHaveCount(8);
  });

  test('REWE Kategoriekacheln zeigen Angebote und Obst & Gemüse', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('cat-angebote')).toBeVisible();
    await expect(page.getByTestId('cat-obst-gemuese')).toBeVisible();
    await expect(page.getByTestId('cat-frische-kuehlung')).toBeVisible();
    await expect(page.getByTestId('cat-brot-backwaren')).toBeVisible();
  });

  test('REWE Kategoriekacheln zweite Reihe ist sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('cat-milch-kaese')).toBeVisible();
    await expect(page.getByTestId('cat-nudeln-reis')).toBeVisible();
    await expect(page.getByTestId('cat-pflege')).toBeVisible();
    await expect(page.getByTestId('cat-getraenke')).toBeVisible();
  });

  test('REWE Hero-Banner Titeltext ist in REWE-Rot gehalten', async ({ page }) => {
    await page.goto(BASE);
    const title = page.getByTestId('rewe-hero-title');
    await expect(title).toBeVisible();
    const color = await title.evaluate((el) => getComputedStyle(el).color);
    // rgb(204, 7, 30) entspricht #CC071E
    expect(color).toBe('rgb(204, 7, 30)');
  });

  test('REWE Suchfeld ist interaktiv', async ({ page }) => {
    await page.goto(BASE);
    const searchInput = page.getByTestId('rewe-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Tomaten');
    await expect(searchInput).toHaveValue('Tomaten');
  });

  test('REWE Footer ist sichtbar', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId('rewe-footer')).toBeVisible();
  });

  test('REWE Design bleibt im Admin-View konsistent', async ({ page }) => {
    await page.goto(BASE);
    // Header bleibt beim View-Wechsel erhalten
    await page.getByTestId('nav-view-admin').click();
    await expect(page.getByTestId('rewe-header')).toBeVisible();
    await expect(page.getByTestId('rewe-nav')).toBeVisible();
    await expect(page.getByText('IT-Admin Dashboard')).toBeVisible({ timeout: 5000 });
    // Hero-Banner und Kategorien sind im Admin-View nicht sichtbar
    await expect(page.getByTestId('rewe-hero-banner')).not.toBeVisible();
    await expect(page.getByTestId('rewe-category-grid')).not.toBeVisible();
  });

  test('REWE Hero-Banner zeigt Ticket-Indikator wenn offene Tickets vorhanden', async ({ page }) => {
    await page.goto(BASE);
    // Ticket erstellen damit Indikator erscheint
    await page.getByTestId('ticket-title').fill('REWE Indikator Test');
    await page.getByTestId('ticket-description').fill('Test für Ticket-Indikator im Hero-Banner');
    await page.getByTestId('ticket-submit').click();
    // Indikator sollte sichtbar sein
    await expect(page.getByTestId('rewe-hero-ticket-indicator')).toBeVisible({ timeout: 5000 });
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
