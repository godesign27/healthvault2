import { createPrivateKey } from "node:crypto";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";

const configs = [
  {
    prefix: "FHIR_EPIC_SANDBOX",
    privatePath: ".secrets/epic-sandbox-private.pem",
    publicPath: "public/.well-known/epic-sandbox-jwks.json",
    url: "https://healthvault.me/.well-known/epic-sandbox-jwks.json",
  },
  {
    prefix: "FHIR_EPIC_PRODUCTION",
    privatePath: ".secrets/epic-production-private.pem",
    publicPath: "public/.well-known/epic-production-jwks.json",
    url: "https://healthvault.me/.well-known/epic-production-jwks.json",
  },
];

const lines = [];
for (const config of configs) {
  const privateKey = createPrivateKey(readFileSync(config.privatePath));
  const privateDer = privateKey.export({ type: "pkcs8", format: "der" });
  const jwks = JSON.parse(readFileSync(config.publicPath, "utf8"));
  const keyId = jwks.keys?.[0]?.kid;
  if (!keyId) throw new Error(`Missing kid in ${config.publicPath}`);

  lines.push(`${config.prefix}_PRIVATE_KEY_PKCS8_BASE64=${privateDer.toString("base64")}`);
  lines.push(`${config.prefix}_KEY_ID=${keyId}`);
  lines.push(`${config.prefix}_JWKS_URL=${config.url}`);
}

const output = ".secrets/epic-supabase.env";
writeFileSync(output, `${lines.join("\n")}\n`, { mode: 0o600 });
chmodSync(output, 0o600);
console.log(`Prepared ${output} for encrypted Supabase secret upload.`);
