import { test, expect } from '@playwright/test';

test.describe('Coach to Player Journey', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Supabase Auth and Data calls
        await page.route('**/auth/v1/session**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    session: {
                        user: { id: 'coach-1', email: 'coach@test.com', user_metadata: { role: 'coach' } },
                        access_token: 'fake-token'
                    }
                })
            });
        });

        await page.route('**/rest/v1/teams**', async route => {
            const method = route.request().method();
            if (method === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify([{ id: 'team-1', slug: 'dragons', name: 'Dragons' }])
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{ id: 'team-1', slug: 'dragons', name: 'Dragons' }])
                });
            }
        });

        await page.route('**/rest/v1/team_members**', async route => {
            await route.fulfill({ status: 201, body: JSON.stringify([]) });
        });

        await page.route('**/rest/v1/players**', async route => {
            await route.fulfill({ status: 201, body: JSON.stringify([]) });
        });
    });

    test('Coach creates team and adds players, then simulated player login', async ({ page }) => {
        // 1. Go to Team Setup
        await page.goto('/team/setup');

        // 2. Fill Team Name
        await page.fill('input[placeholder*="台北棒球隊"]', 'Flying Dragons');
        await page.fill('input[placeholder="taipei-baseball"]', 'dragons');

        // 3. Click Create
        await page.click('button:has-text("建立球隊")');

        // 4. Expect redirect to dashboard (based on our App logic, it might go to /dragons)
        await expect(page).toHaveURL(/\/dragons/);

        // 5. Go to Add Players
        await page.goto('/dragons/players/add');

        // 6. Fill 5 players (simplified for test)
        for (let i = 1; i <= 5; i++) {
            await page.fill(`tr:nth-child(${i}) input[placeholder*="例: 王小明"]`, `Player ${i}`);
        }

        // 7. Click Save
        await page.click('button:has-text("儲存所有球員")');

        // 8. Expect redirect to players list
        await expect(page).toHaveURL(/\/dragons\/players/);

        // 9. Simulate Player View (Direct link to player portal)
        // In our app, player login is often /[teamSlug]/login or via short code
        await page.goto('/dragons/login');
        await expect(page.locator('h1, h2')).toContainText(/登入/);
    });
});
