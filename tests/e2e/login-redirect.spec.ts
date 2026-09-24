import { expect, test } from '@playwright/test';
import customerConfig from '../../src/lib/customer-config.json' with { type: 'json' };

const msalConfig = customerConfig.bnf.msal;
if (!msalConfig) throw new Error('BNF MSAL configuration is required for this test');

const { clientId, tenantId } = msalConfig;
const customerUrl = 'https://customer.example';

function encodeTokenPart(value: object): string {
	return Buffer.from(JSON.stringify(value)).toString('base64url');
}

test('processes the Microsoft callback before restoring the customer URL', async ({ page }) => {
	let tokenRequested = false;
	let loginNonce = '';

	await page.route('https://api.test/initialize-agent**', async (route) => {
		await route.fulfill({ json: { customer_name: 'bnf' } });
	});

	await page.route('https://login.microsoftonline.com/**', async (route) => {
		const requestUrl = new URL(route.request().url());

		if (requestUrl.pathname.endsWith('/oauth2/v2.0/authorize')) {
			const state = requestUrl.searchParams.get('state');
			const nonce = requestUrl.searchParams.get('nonce');
			expect(state).toBeTruthy();
			expect(nonce).toBeTruthy();
			loginNonce = nonce!;

			const callbackUrl = new URL('/', 'http://127.0.0.1:4173');
			const responseParams = new URLSearchParams({
				code: 'e2e-authorization-code',
				state: state!,
				session_state: 'e2e-session'
			});
			if (requestUrl.searchParams.get('response_mode') === 'query') {
				callbackUrl.search = responseParams.toString();
			} else {
				callbackUrl.hash = responseParams.toString();
			}

			await route.fulfill({
				contentType: 'text/html',
				body: `<script>location.replace(${JSON.stringify(callbackUrl.toString())})</script>`
			});
			return;
		}

		if (requestUrl.pathname.endsWith('/oauth2/v2.0/token')) {
			tokenRequested = true;
			const now = Math.floor(Date.now() / 1000);
			const idToken = [
				encodeTokenPart({ alg: 'none', typ: 'JWT' }),
				encodeTokenPart({
					aud: clientId,
					iss: `https://login.microsoftonline.com/${tenantId}/v2.0`,
					iat: now,
					nbf: now,
					exp: now + 3600,
					nonce: loginNonce,
					oid: 'e2e-user-id',
					sub: 'e2e-user-id',
					tid: tenantId,
					name: 'E2E User',
					preferred_username: 'e2e@example.com',
					ver: '2.0'
				}),
				''
			].join('.');

			await route.fulfill({
				json: {
					token_type: 'Bearer',
					scope: 'User.Read',
					expires_in: 3600,
					ext_expires_in: 3600,
					access_token: idToken,
					id_token: idToken,
					client_info: Buffer.from(JSON.stringify({ uid: 'e2e-user-id', utid: tenantId })).toString(
						'base64url'
					)
				}
			});
			return;
		}

		await route.fallback();
	});

	await page.goto(`/?url=${encodeURIComponent(customerUrl)}`);
	await page.getByRole('button', { name: 'Akzeptieren' }).click();
	await page.getByRole('button', { name: 'Mit Microsoft anmelden' }).click();

	await expect(page.getByPlaceholder('Nachricht eingeben...')).toBeVisible();
	expect(tokenRequested).toBe(true);
	await expect.poll(() => new URL(page.url()).searchParams.get('url')).toBe(customerUrl);
	await expect(page.getByRole('button', { name: 'Mit Microsoft anmelden' })).toBeHidden();
});
