import crypto from "node:crypto";

export type SignaturePayload = {
  content: string;
  sourcePath: string;
  fileType: string;
};

type SignatureKeyring = {
  currentKeyId: string;
  keys: Record<string, string>;
};

export type FileSignatureEnvelope = {
  contentHash: string;
  signature: string;
  signatureAlgo: "hmac-sha256";
  signatureKeyId: string;
  signedAt: string;
};

function parseKeyring(): SignatureKeyring {
  const currentKeyId = process.env.FILE_SIGNATURE_CURRENT_KEY_ID?.trim() || "default";
  const rawKeys = process.env.FILE_SIGNATURE_KEYS?.trim();

  if (!rawKeys) {
    const fallback = process.env.FILE_SIGNATURE_SECRET?.trim();
    if (!fallback) {
      throw new Error(
        "FILE_SIGNATURE_KEYS (JSON) or FILE_SIGNATURE_SECRET is required for digital signature",
      );
    }
    return {
      currentKeyId,
      keys: { [currentKeyId]: fallback },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawKeys);
  } catch {
    throw new Error("FILE_SIGNATURE_KEYS must be valid JSON object");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("FILE_SIGNATURE_KEYS must be a JSON object");
  }

  const keys = Object.entries(parsed).reduce<Record<string, string>>((acc, [id, value]) => {
    if (typeof value === "string" && value.trim()) {
      acc[id] = value.trim();
    }
    return acc;
  }, {});

  if (!keys[currentKeyId]) {
    throw new Error(`FILE_SIGNATURE_KEYS is missing current key id: ${currentKeyId}`);
  }

  return { currentKeyId, keys };
}

function canonicalizePayload(payload: SignaturePayload): string {
  return JSON.stringify({
    content: payload.content.replace(/\r\n/g, "\n"),
    sourcePath: payload.sourcePath.trim(),
    fileType: payload.fileType.trim().toLowerCase(),
  });
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function hmacSign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function signFilePayload(payload: SignaturePayload): FileSignatureEnvelope {
  const keyring = parseKeyring();
  const canonical = canonicalizePayload(payload);
  const contentHash = sha256(canonical);
  const signature = hmacSign(contentHash, keyring.keys[keyring.currentKeyId]);

  return {
    contentHash,
    signature,
    signatureAlgo: "hmac-sha256",
    signatureKeyId: keyring.currentKeyId,
    signedAt: new Date().toISOString(),
  };
}

export function verifyFilePayload(
  payload: SignaturePayload,
  envelope: Pick<
    FileSignatureEnvelope,
    "contentHash" | "signature" | "signatureAlgo" | "signatureKeyId"
  >,
): boolean {
  if (envelope.signatureAlgo !== "hmac-sha256") {
    return false;
  }

  const keyring = parseKeyring();
  const key = keyring.keys[envelope.signatureKeyId];
  if (!key) {
    return false;
  }

  const canonical = canonicalizePayload(payload);
  const recomputedHash = sha256(canonical);
  if (recomputedHash !== envelope.contentHash) {
    return false;
  }

  const expectedSignature = hmacSign(recomputedHash, key);
  if (expectedSignature.length !== envelope.signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(envelope.signature),
  );
}
