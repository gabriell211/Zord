import { z } from "zod";

export const MAX_AVATAR_BYTES = 1024 * 1024;
export const MAX_AVATAR_BODY_BYTES = 1_500_000;

export const avatarUploadSchema = z.strictObject({
    base64: z.string().min(16).max(1_400_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
    mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
});

export function detectImageType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
    if (bytes.length >= 8 && bytes.subarray(0, 8).every((byte, i) =>
        byte === [137, 80, 78, 71, 13, 10, 26, 10][i]
    )) return "image/png";
    if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
        return "image/jpeg";
    }
    if (bytes.length >= 12 &&
        new TextDecoder("ascii").decode(bytes.subarray(0, 4)) === "RIFF" &&
        new TextDecoder("ascii").decode(bytes.subarray(8, 12)) === "WEBP") {
        return "image/webp";
    }
    return null;
}

export function validatedAvatarBytes(base64: string, claimedMime?: string): { data: Buffer; mime: string } | null {
    const parsed = z.string().min(16).max(1_400_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/).safeParse(base64);
    if (!parsed.success) return null;
    const data = Buffer.from(parsed.data, "base64");
    if (data.length === 0 || data.length > MAX_AVATAR_BYTES) return null;
    if (data.toString("base64") !== parsed.data) return null;
    const mime = detectImageType(data);
    if (!mime || (claimedMime && mime !== claimedMime)) return null;
    return { data, mime };
}

export async function readJsonBodyLimited(request: Request, limit = MAX_AVATAR_BODY_BYTES): Promise<unknown> {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isFinite(contentLength) || contentLength > limit || contentLength < 0) {
        throw new RangeError("Corpo excede o limite permitido.");
    }
    const reader = request.body?.getReader();
    if (!reader) throw new SyntaxError("Corpo ausente.");
    const chunks: Uint8Array[] = [];
    let bytesRead = 0;
    try {
        while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytesRead += chunk.value.byteLength;
            if (bytesRead > limit) {
                await reader.cancel();
                throw new RangeError("Corpo excede o limite permitido.");
            }
            chunks.push(chunk.value);
        }
        const raw = Buffer.concat(chunks, bytesRead).toString("utf8");
        return JSON.parse(raw) as unknown;
    } finally {
        reader.releaseLock();
    }
}
