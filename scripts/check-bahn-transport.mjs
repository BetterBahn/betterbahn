// Opt-in live diagnostic: sends exactly two equivalent journey searches.
// Run: node --experimental-strip-types scripts/check-bahn-transport.mjs
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import https from "node:https";
import { createClient } from "db-vendo-client";
import { profile } from "db-vendo-client/p/db/index.js";
import { bahnAgent } from "../utils/bahnApiFetch.ts";

const hash = (value) => createHash("sha256").update(value).digest("hex");
let capturedFixture;
const captured = new Error("captured request");
const client = createClient({
	...profile,
	request: (context, userAgent, data) => {
		const body = JSON.stringify(context.profile.transformReqBody(context, data.body));
		capturedFixture = {
			url: new URL(data.endpoint + (data.path ?? "")),
			method: data.method.toUpperCase(),
			body,
			headers: {
				"User-Agent": userAgent,
				"Accept-Language": "de",
				...data.headers,
				"Accept-Encoding": "identity",
				"Content-Length": String(Buffer.byteLength(body)),
				Connection: "close",
			},
		};
		throw captured;
	},
}, "betterbahn-transport-diagnostic");
try {
	await client.journeys("8000050", "8010085", {
		departure: new Date(Date.now() + 86_400_000), results: 1,
	});
} catch (error) { if (error !== captured) throw error; }

const fixture = capturedFixture;
const { address } = await lookup(fixture.url.hostname, { family: 4 });
const defaultAgent = new https.Agent({ ALPNProtocols: ["http/1.1"] });
console.log(JSON.stringify({ node: process.version, openssl: process.versions.openssl, platform: process.platform }));

try {
	for (const [label, agent] of [["default", defaultAgent], ["configured", bahnAgent]]) {
		const result = await new Promise((resolve, reject) => {
			const req = https.request(fixture.url, {
				method: fixture.method, headers: fixture.headers, agent,
				lookup: (_hostname, options, callback) => options.all
					? callback(null, [{ address, family: 4 }])
					: callback(null, address, 4),
			}, (response) => {
				const chunks = [];
				response.on("data", (chunk) => chunks.push(chunk));
				response.on("error", reject);
				response.on("end", () => {
					let json;
					try { json = JSON.parse(Buffer.concat(chunks).toString()); } catch { json = {}; }
					resolve({
						label, status: response.statusCode, code: json.code ?? null,
						journeys: json.verbindungen?.length ?? null,
						httpRequestHash: hash(req._header + fixture.body),
					});
				});
			});
			req.on("error", reject);
			req.setTimeout(30_000, () => req.destroy(new Error("request timed out")));
			req.end(fixture.body);
		});
		console.log(JSON.stringify(result));
	}
} finally {
	defaultAgent.destroy();
	bahnAgent.destroy();
}
