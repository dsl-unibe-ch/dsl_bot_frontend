import { PUBLIC_API } from '$env/static/public';
import customerConfigData from './customer-config.json';
import { MsalAuth, type MsalCustomerConfig } from './msal-auth';

export interface CustomerConfigEntry {
	auth: boolean;
	msal?: MsalCustomerConfig;
	introduction_text?: string;
}

type CustomerConfigMap = Record<string, CustomerConfigEntry>;

const configMap = customerConfigData as CustomerConfigMap;

/** Resolves per-customer settings (e.g. whether login is required) and initializes the frontend for the current customer. */
export class CustomerConfig {
	readonly customerName: string;
	readonly auth: boolean;
	readonly msal?: MsalCustomerConfig;
	readonly introductionText: string;

	private constructor(customerName: string, entry: CustomerConfigEntry) {
		this.customerName = customerName;
		this.auth = entry.auth;
		this.msal = entry.msal;
		this.introductionText = entry.introduction_text ?? '';
	}

	/** Resolves the customer for the given origin via the backend, then applies the local customer_config. */
	static async init(origin: string): Promise<CustomerConfig> {
		const res = await fetch(`${PUBLIC_API}/initialize-agent?origin=${origin}`, {
			credentials: 'include'
		});
		if (!res.ok) {
			throw new Error(`Failed to initialize agent: ${res.status}`);
		}
		const data = await res.json();
		const customerName = data?.customer_name || '';
		const entry = configMap[customerName];
		if (!entry) {
			throw new Error(`Unknown customer "${customerName}": no entry in customer-config.json`);
		}
		return new CustomerConfig(customerName, entry);
	}

	/** Builds the MsalAuth instance for this customer. Throws if auth is required but no msal config is set. */
	createMsalAuth(): MsalAuth {
		if (!this.msal) {
			throw new Error(`No msal config found for customer "${this.customerName}"`);
		}
		return new MsalAuth(this.msal);
	}
}
