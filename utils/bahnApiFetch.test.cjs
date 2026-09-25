const assert = require("node:assert/strict");
const test = require("node:test");
const http = require("node:http");
const https = require("node:https");
const net = require("node:net");
const { gzipSync } = require("node:zlib");
const { bahnAgent, selectBahnAgent, withBahnAgent, fetchFromBahn } = require("./bahnApiFetch.ts");

test("restricts the TLS agent to the HTTPS Bahn API paths", () => {
	for (const url of [
		"https://www.bahn.de/web/api/angebote/verbindung/example",
		"https://int.bahn.de/web/api/angebote/recon",
		"https://app.services-bahn.de/mob/angebote/fahrplan",
	]) assert.equal(selectBahnAgent(new URL(url)), bahnAgent);
	for (const url of [
		"http://www.bahn.de/web/api/test",
		"https://www.bahn.de/buchung/start",
		"https://example.com/web/api/test",
		"https://www.bahn.de.example.com/web/api/test",
	]) assert.equal(selectBahnAgent(new URL(url)), undefined);
});

test("keeps Vendo request data intact when applying the agent hook", () => {
	const options = { method: "POST", body: '{"test":1}', query: { page: 2 }, headers: { Accept: "application/json" } };
	const result = withBahnAgent({}, options);
	assert.deepEqual(result, { ...options, agent: selectBahnAgent });
	assert.equal(options.agent, undefined);
});

test("preserves the Vendo proxy agent when a proxy is configured", () => {
	const previous = process.env.HTTPS_PROXY;
	process.env.HTTPS_PROXY = "http://proxy.example:8080";
	try {
		const options = { agent: {}, method: "POST", body: "{}" };
		assert.equal(withBahnAgent({}, options), options);
	} finally {
		if (previous === undefined) delete process.env.HTTPS_PROXY;
		else process.env.HTTPS_PROXY = previous;
	}
});

const listen = (server) => new Promise((resolve) => { server.listen(0, "127.0.0.1", resolve); });
const close = (server) => new Promise((resolve) => { server.close(resolve); });

test("decodes compressed JSON and preserves separate Set-Cookie headers", async () => {
	let userAgent;
	const server = http.createServer((req, res) => {
		userAgent = req.headers["user-agent"];
		res.writeHead(200, {
			"Content-Type": "application/json",
			"Content-Encoding": "gzip",
			"Set-Cookie": ["first=1; Path=/", "second=2; Expires=Wed, 21 Oct 2037 07:28:00 GMT"],
		});
		res.end(gzipSync('{"ok":true}'));
	});
	await listen(server);
	try {
		const response = await fetchFromBahn(`http://127.0.0.1:${server.address().port}/`, {});
		assert.deepEqual(await response.json(), { ok: true });
		assert.equal(userAgent, "betterbahn/0.1.0");
		assert.deepEqual(response.headers.raw()["set-cookie"], ["first=1; Path=/", "second=2; Expires=Wed, 21 Oct 2037 07:28:00 GMT"]);
	} finally { await close(server); }
});

test("returns HTTP errors without retrying", async () => {
	let calls = 0;
	let userAgent;
	const server = http.createServer((req, res) => { calls += 1; userAgent = req.headers["user-agent"]; res.writeHead(403); res.end("blocked"); });
	await listen(server);
	try {
		const response = await fetchFromBahn(`http://127.0.0.1:${server.address().port}/`, { headers: { "User-Agent": "explicit-app-agent" } });
		assert.equal(response.status, 403);
		assert.equal(await response.text(), "blocked");
		assert.equal(calls, 1);
		assert.equal(userAgent, "explicit-app-agent");
	} finally { await close(server); }
});

function helloExtensions(buffer) {
	let offset = 5 + 4 + 2 + 32;
	offset += 1 + buffer[offset];
	offset += 2 + buffer.readUInt16BE(offset);
	offset += 1 + buffer[offset];
	const end = offset + 2 + buffer.readUInt16BE(offset);
	offset += 2;
	const extensions = new Map();
	while (offset < end) {
		const type = buffer.readUInt16BE(offset);
		const length = buffer.readUInt16BE(offset + 2);
		offset += 4;
		extensions.set(type, buffer.subarray(offset, offset + length));
		offset += length;
	}
	return extensions;
}

test("sends compatible TLS groups and only HTTP/1.1 on the wire", { timeout: 5_000 }, async () => {
	let resolveHello;
	const hello = new Promise((resolve) => { resolveHello = resolve; });
	const server = net.createServer((socket) => {
		let data = Buffer.alloc(0);
		socket.on("data", (chunk) => {
			data = Buffer.concat([data, chunk]);
			if (data.length >= 5 && data.length >= 5 + data.readUInt16BE(3)) {
				resolveHello(data);
				socket.destroy();
			}
		});
	});
	await listen(server);
	const req = https.get(`https://app.services-bahn.de:${server.address().port}/mob/test`, {
		agent: bahnAgent,
		lookup: (_hostname, options, callback) => options.all
			? callback(null, [{ address: "127.0.0.1", family: 4 }])
			: callback(null, "127.0.0.1", 4),
	});
	req.on("error", () => {});
	try {
		const extensions = helloExtensions(await hello);
		const rawGroups = extensions.get(10);
		const groups = [];
		for (let i = 2; i < rawGroups.length; i += 2) groups.push(rawGroups.readUInt16BE(i));
		assert.deepEqual(groups.filter((group) => group !== 4588), [29, 23, 24]);
		assert.deepEqual([...extensions.get(16)], [0, 9, 8, ...Buffer.from("http/1.1")]);
	} finally {
		req.destroy();
		bahnAgent.destroy();
		await close(server);
	}
});
