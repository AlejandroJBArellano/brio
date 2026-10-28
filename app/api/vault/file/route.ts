import { getDb } from "@/lib/db";
import { getBucketName, getS3Client } from "@/lib/s3";
import { getCachedOwnerSession } from "@/lib/dal/auth";
import { verifyAgentAuth } from "@/lib/agentAuth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 1. Enforce authentication (owner session or authorized agent token)
  const session = await getCachedOwnerSession();
  const agentAuth = verifyAgentAuth(request);

  if (!session.isAuthenticated && !agentAuth.authorized) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const key = searchParams.get("key");
  const download = searchParams.get("download") === "true";

  if (!id && !key) {
    return new NextResponse("Missing file identifier", { status: 400 });
  }

  // Prevent path traversal attempts
  if (key && (key.includes("..") || key.startsWith("/"))) {
    return new NextResponse("Invalid file key", { status: 400 });
  }

  try {
    const sql = getDb();
    let fileKey = key;
    let fileName = "document.pdf";

    if (id) {
      const rows = await sql`
        SELECT file_key, file_name, title FROM vault_items WHERE id = ${id} LIMIT 1;
      `;
      if (rows.length === 0 || !rows[0].file_key) {
        return new NextResponse("File not found in vault", { status: 404 });
      }
      fileKey = rows[0].file_key;
      fileName = rows[0].file_name || `${rows[0].title}.pdf`;
    }

    if (!fileKey) {
      return new NextResponse("File key not found", { status: 404 });
    }

    const client = getS3Client();
    const bucket = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const s3Response = await client.send(command);

    if (!s3Response.Body) {
      return new NextResponse("Empty file body", { status: 404 });
    }

    const contentType = s3Response.ContentType || "application/pdf";
    const disposition = download ? "attachment" : "inline";
    const bytes = await s3Response.Body.transformToByteArray();

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `${disposition}; filename="${encodeURIComponent(fileName)}"`
    );
    headers.set("Content-Length", bytes.length.toString());
    // Strict private caching to prevent public CDN or proxy leaking of vault documents
    headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[Vault File Stream Error]:", error);
    return new NextResponse("Error streaming file", { status: 500 });
  }
}
