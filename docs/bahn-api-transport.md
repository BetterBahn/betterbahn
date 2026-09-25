# Bahn API transport investigation

On 2026-09-24, equivalent requests from the same Windows host and its Linux Docker
environment reproduced DB edge blocking with Node's default TLS settings. A scoped
Node HTTPS agent resolved the observed failures without curl or browser headers.

## Controlled reproduction

Each comparison reused one serialized journey request, including its departure
time and correlation ID. DNS was resolved once and the destination IPv4 address
pinned, retaining the original TLS server name and certificate verification.
HTTP/1.1, method, headers and body stayed identical. The serialized HTTP requests
had the same SHA-256 hash. Requests used fresh TLS connections.

| Runtime / TLS settings | Journey endpoint result |
| --- | --- |
| Windows Node 26.10.0 / OpenSSL 3.5.8, defaults | 452 OPS_BLOCKED |
| Same, only db-vendo-client's custom cipher list | 452 OPS_BLOCKED |
| Same, X25519/P-256/P-384 groups | 200, journeys returned |
| Same, X25519MLKEM768/X25519/P-256/P-384 groups | 200, journeys returned |
| Windows Node 24.13.0 / OpenSSL 3.5.4, configured groups | 200, journeys returned |
| Linux node:26-alpine, default groups | 452 OPS_BLOCKED |
| Same Linux container, configured groups | 200, journeys returned |
| Same Linux container, restored defaults | 452 OPS_BLOCKED |
| Windows curl 8.21.0 / Schannel | 200, journeys returned |
| Alpine curl 8.22.0 / OpenSSL 3.5.8 | 452 OPS_BLOCKED |

The shared-journey web endpoint independently changed from 403 OPS_BLOCKED to 200
with the configured agent. The configured web request also succeeded in Linux.

## What was isolated

A local TCP listener captured the ClientHello without contacting DB. Node 26's
default supported_groups vector was:

```
4588, 29, 23, 30, 24, 25, 256, 257
```

An explicit equivalent group list remained blocked. Swapping only the last two
entries (`ffdhe2048` and `ffdhe3072`) made the same HTTP request succeed. Removing
either of those entries also succeeded. Hybrid key exchange remained usable.
Therefore the evidence points to a TLS fingerprint classification involving the
ordered group vector, rather than an unsupported individual algorithm or a
general inability of native Node to access the API.
Both failing and successful requests negotiated TLS 1.3 with AES-256-GCM.

The private edge rules are not observable, so this does not establish a specific
JA3/JA4 rule or guarantee the same outcome on other networks or after rule changes.

A subsequent application test isolated a separate web-API condition: with the
compatible agent, node-fetch's default User-Agent received an HTML 403, while
`betterbahn/0.1.0` returned JSON with HTTP 200. Web requests therefore identify the
application explicitly; they do not claim to be a browser. This header change
alone does not resolve the default TLS fingerprint's OPS_BLOCKED response.

## Implementation

`utils/bahnApiFetch.ts` supplies an HTTPS agent only for the known HTTPS Bahn API
hosts and paths. It advertises `X25519MLKEM768:X25519:P-256:P-384` on OpenSSL 3.5+;
older OpenSSL versions use the classical subset. Certificate checks remain enabled.
ALPN advertises HTTP/1.1 because node-fetch 2 cannot parse HTTP/2.

The Vendo client uses its public `transformReq` hook, retaining its built-in
request processing and errors. If `HTTPS_PROXY` or `HTTP_PROXY` is set, the hook
retains the client's proxy agent instead of bypassing it; the TLS adjustment is
only verified for direct connections. Web requests use node-fetch 2 (also used internally
by db-vendo-client), the same agent, automatic decompression and separate response
cookies. There is no subprocess, impersonated User-Agent or retry on 403/452.

Run the offline regression tests with `pnpm test`. The TLS regression captures the
actual emitted ClientHello instead of merely asserting an options object.

For an opt-in live comparison (two API requests):

```sh
node --experimental-strip-types scripts/check-bahn-transport.mjs
```

The script emits runtime versions, HTTP status, API error code, journey count and
request hashes; it does not print response cookies or travel details.

## Application verification (2026-09-25)

- Six offline regression tests passed on Windows Node 24.13.0 and 26.10.0.
- TypeScript passed; lint reported no errors and no warnings in the changed code.
- Production builds using `next build --webpack` passed on Windows and Alpine Linux.
- On both Windows Node 26 and the Alpine Node 26 production container, the original
  shared link returned a priced journey. The tRPC analysis subscription checked all
  eight split points and completed with one cheaper split option, without API errors.
- The default Turbopack Docker build failed while downloading Google font assets in
  this environment. For the Linux runtime test only, a temporary Dockerfile changed
  `RUN pnpm run build` to `RUN pnpm exec next build --webpack`; all other build and
  runtime steps were unchanged. The repository keeps its original build command.

## Related sources

- [Node TLS options](https://nodejs.org/api/tls.html#tlscreatesecurecontextoptions)
- [OpenSSL group-list configuration](https://docs.openssl.org/3.5/man3/SSL_CTX_set1_curves/)
- [Earlier Node/OpenSSL comparison](https://github.com/public-transport/db-vendo-client/issues/46#issuecomment-4995037387)
- [Later environment-dependent failures](https://github.com/public-transport/db-vendo-client/issues/46#issuecomment-5152231109)
- [HTTP/2 negotiation versus node-fetch 2](https://github.com/public-transport/db-vendo-client/issues/53)
