import { PublicClientApplication, type AccountInfo, type Configuration } from '@azure/msal-browser';

export interface MsalCustomerConfig {
	clientId: string;
	tenantId: string;
}

/** Wraps an MSAL PublicClientApplication for a single customer's Azure AD app registration. */
export class MsalAuth {
	private readonly msalInstance: PublicClientApplication;

	constructor(config: MsalCustomerConfig) {
		const msalConfig: Configuration = {
			auth: {
				clientId: config.clientId,
				authority: `https://login.microsoftonline.com/${config.tenantId}`,
				redirectUri: window.location.origin + window.location.pathname
			},
			cache: {
				cacheLocation: 'sessionStorage'
			}
		};
		this.msalInstance = new PublicClientApplication(msalConfig);
	}

	/** Completes a pending redirect sign-in (if any) and returns the active account, if signed in. */
	async initialize(): Promise<AccountInfo | null> {
		await this.msalInstance.initialize();
		const redirectResult = await this.msalInstance.handleRedirectPromise();
		if (redirectResult?.account) {
			this.msalInstance.setActiveAccount(redirectResult.account);
			return redirectResult.account;
		}
		return this.msalInstance.getAllAccounts()[0] ?? null;
	}

	/** Navigates the browser to the Microsoft sign-in page; returns to redirectUri on completion. */
	login(): Promise<void> {
		return this.msalInstance.loginRedirect({ scopes: ['User.Read'] });
	}

	logout(): Promise<void> {
		return this.msalInstance.logoutRedirect();
	}
}
