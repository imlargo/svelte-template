<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLFormAttributes } from 'svelte/elements';
	import { GOOGLE_CLIENT_ID } from '$lib/config/constants';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLFormAttributes> = $props();

	const id = $props.id();

	async function handleLogin() {
		// Google's OAuth 2.0 endpoint for requesting an access token
		const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

		// Create <form> element to submit parameters to OAuth 2.0 endpoint.
		const form = document.createElement('form');
		form.setAttribute('method', 'GET'); // Send as a GET request.
		form.setAttribute('action', oauth2Endpoint);

		// Parameters to pass to OAuth 2.0 endpoint.
		const params: Record<string, string> = {
			client_id: GOOGLE_CLIENT_ID,
			redirect_uri: `${window.location.origin}/authorize`,
			response_type: 'code',
			prompt: 'select_account',
			scope: 'openid profile email',
			include_granted_scopes: 'true'
		};

		// Add form parameters as hidden input values.
		for (const p in params) {
			const input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			input.setAttribute('name', p);
			input.setAttribute('value', params[p]);
			form.appendChild(input);
		}

		// Add form to page and submit it to open the OAuth 2.0 endpoint.
		document.body.appendChild(form);
		form.submit();
	}
</script>

<form class={cn('flex flex-col gap-6', className)} bind:this={ref} {...restProps}>
	<div class="flex flex-col items-center gap-2 text-center">
		<h1 class="text-2xl font-bold">Iniciar sesión en tu cuenta</h1>
		<p class="text-muted-foreground text-balance text-sm">
			Ingresa tu email para iniciar sesión en tu cuenta
		</p>
	</div>
	<div class="grid gap-6">
		<div class="grid gap-3">
			<Label for="email-{id}">Email</Label>
			<Input id="email-{id}" type="email" placeholder="correo@ejemplo.com" required />
		</div>
		<div class="grid gap-3">
			<div class="flex items-center">
				<Label for="password-{id}">Contraseña</Label>
				<a href="##" class="ml-auto text-sm underline-offset-4 hover:underline">
					¿Olvidaste tu contraseña?
				</a>
			</div>
			<Input id="password-{id}" type="password" required />
		</div>
		<Button type="submit" class="w-full">Iniciar sesión</Button>
		<div
			class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
		>
			<span class="bg-background text-muted-foreground relative z-10 px-2"> O continúa con </span>
		</div>
		<Button variant="outline" class="w-full" onclick={handleLogin}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				fill="currentColor"
				class="bi bi-google"
				viewBox="0 0 16 16"
			>
				<path
					d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"
				/>
			</svg>
			Iniciar sesión con Google
		</Button>
	</div>
	<div class="text-center text-sm">
		¿No tienes una cuenta?
		<a href="##" class="underline underline-offset-4"> Regístrate </a>
	</div>
</form>
