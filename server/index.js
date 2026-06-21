import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "data");
const dataFile = path.join(dataDir, "records.json");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(
      dataFile,
      JSON.stringify(
        {
          version: 1,
          entries: [],
        },
        null,
        2,
      ),
      "utf8",
    );
  }
}

app.get("/api/records", async (_request, response) => {
  try {
    await ensureDataFile();
    const content = await fs.readFile(dataFile, "utf8");
    response.type("application/json").send(content);
  } catch (error) {
    response.status(500).send(error instanceof Error ? error.message : "读取 records.json 失败。");
  }
});

app.put("/api/records", async (request, response) => {
  try {
    await ensureDataFile();
    const payload = request.body;

    if (!payload || payload.version !== 1 || !Array.isArray(payload.entries)) {
      response.status(400).send("提交的数据格式不正确，必须包含 version: 1 和 entries 数组。");
      return;
    }

    await fs.writeFile(dataFile, JSON.stringify(payload, null, 2), "utf8");
    response.status(204).end();
  } catch (error) {
    response.status(500).send(error instanceof Error ? error.message : "写入 records.json 失败。");
  }
});

await ensureDataFile();

app.listen(port, () => {
  console.log(`JSON server ready at http://localhost:${port}`);
  console.log(`Data file: ${dataFile}`);
});
