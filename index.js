/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// https://registry.npmjs.org/axios/0.2.0
const CUSTOM_DOMAIN = 'https://npmproxy.wxhome.onflashdrive.app';
const NPM_JS = 'https://registry.npmjs.org';

const json = (data = {}, code = 200, headers = {}) => {
	return new Response(JSON.stringify(data), {
		status: code,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'X-Powered-By': 'X-Powered-By cloudflare npm proxy',
			...headers,
		},
	});
};

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request, env, ctx) {
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
		const url = new URL(request.url);
		if ('GET' !== request.method) {
			return Response.redirect(`${NPM_JS}${url.pathname}`, 302);
		}
		// console.log('xxx: ', url);
		if ('/' === url.pathname) {
			return new Response(`Hello ${CUSTOM_DOMAIN}`);
		}

		if (url.pathname.endsWith('.tgz')) {
			let response = await fetch(`${NPM_JS}${url.pathname}`);
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.indexOf('application/json') !== -1) {
				return json({ error: `NPM fetch failed: ${(await response.json()).message}` }, 500);
			} else {
				return response;
			}
		}

		let data = await (await fetch(`${NPM_JS}${url.pathname}`)).json();
		if (data.error) {
			return json(data, 500);
		}

		if (data && data.dist && data.dist.tarball) {
			data.dist.tarball = data.dist.tarball.replace(NPM_JS, CUSTOM_DOMAIN);
		}
		return json(data);
	},
};
