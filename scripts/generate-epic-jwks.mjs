import { generateKeyPairSync, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const environments = [
  {
    name: "sandbox",
    privatePath: ".secrets/epic-sandbox-private.pem",
    publicPath: "public/.well-known/epic-sandbox-jwks.json",
  },
  {
    name: "production",
    privatePath: ".secrets/epic-production-private.pem",
    publicPath: "public/.well-known/epic-production-jwks.json",
  },
];

for (const environment of environments) {
  const privatePath = resolve(environment.privatePath);
  const publicPath = resolve(environment.publicPath);

  if (existsSync(privatePath) || existsSync(publicPath)) {
    throw new Error(
      `Refusing to overwrite the existing ${environment.name} Epic key pair.`,
    );
  }

  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "P-384",
  });
  const kid = `health-vault-epic-${environment.name}-${randomUUID()}`;
  const publicJwk = publicKey.export({ format: "jwk" });

  mkdirSync(dirname(privatePath), { recursive: true, mode: 0o700 });
  mkdirSync(dirname(publicPath), { recursive: true });
  writeFileSync(
    privatePath,
    privateKey.export({ type: "pkcs8", format: "pem" }),
    { mode: 0o600 },
  );
  writeFileSync(
    publicPath,
    `${JSON.stringify({
      keys: [{ ...publicJwk, kid, alg: "ES384", use: "sig" }],
    }, null, 2)}\n`,
  );
}

console.log("Generated separate Epic sandbox and production key pairs.");
console.log("Private keys are in ignored .secrets/ files; public JWKS files are ready to deploy.");
