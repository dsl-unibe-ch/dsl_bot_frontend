<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { toast } from 'svelte-sonner';
	import type { MsalAuth } from '$lib/msal-auth';

	let { msalAuth, origin }: { msalAuth: MsalAuth; origin: string } = $props();

	let loading = $state(false);

	const signIn = async () => {
		loading = true;
		try {
			// Azure AD only allows the bare site URL as redirect URI, so stash the
			// customer origin here and recover it from sessionStorage after the redirect.
			sessionStorage.setItem('msal_origin', origin);
			await msalAuth.login();
		} catch (error) {
			console.error(error);
			toast.error('Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
			loading = false;
		}
	};
</script>

<div class="mx-auto flex w-full max-w-sm flex-col items-center gap-4 p-4">
	<h1 class="text-center text-xl font-semibold">Anmeldung erforderlich</h1>
	<p class="text-center text-sm text-gray-500">
		Bitte melden Sie sich mit Ihrem Microsoft-Konto an, um den Chatbot zu nutzen.
	</p>
	<Button onclick={signIn} disabled={loading}>
		{#if loading}
			<LoaderCircle class="animate-spin" />
		{/if}
		Mit Microsoft anmelden
	</Button>
</div>
