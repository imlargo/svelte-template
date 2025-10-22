import { BACKEND_BASE_URL } from '$lib/config/constants';
import { storeAuth } from '$lib/features/auth/stores/auth.svelte';
import { ApiClient } from './client';

const api = new ApiClient({
	baseUrl: BACKEND_BASE_URL,
	retrieveAuthToken: () => storeAuth.getAccessToken() || ''
});

export default api;
