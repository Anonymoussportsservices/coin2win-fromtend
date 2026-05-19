import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { appendFile } from "fs/promises";

export async function POST(req: NextRequest) {
  await appendFile("/tmp/coin2win-upload-debug.log", new Date().toISOString()+" POST /ui-api/upload hit\n");
  const form = await req.formData();
  const file = form.get("file") as File;

  if (!file) {
    return new Response(JSON.stringify({ error: "No file" }), { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = Date.now() + "_" + file.name.replace(/\s+/g, "_");
  const filepath = path.join("/var/www/coin2win-ui/public/uploads", filename);

  await writeFile(filepath, buffer);
  await appendFile("/tmp/coin2win-upload-debug.log", new Date().toISOString()+" saved "+filename+" size="+buffer.length+"\n");

  return new Response(
    JSON.stringify({ url: "/uploads/" + filename }),
    { headers: { "Content-Type": "application/json" } }
  );
}
