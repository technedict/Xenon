import express from "express";
import pkg from "pg";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(express.json());

const onlineDB = new Pool({ connectionString: process.env.ONLINE_DB_URL });
const offlineDB = new Pool({ connectionString: process.env.OFFLINE_DB_URL });

// Code generator
function generateCode() {
  return "XENON-" + crypto.randomBytes(12).toString("hex").toUpperCase();
}

async function insertCode(client, code, type) {
  const query = `INSERT INTO codes (code_string, account_type) VALUES ($1, $2)`;
  await client.query(query, [code, type]);
}

async function generateBatch({ users = 0, creators = 0 }) {
  const onlineClient = await onlineDB.connect();
  const offlineClient = await offlineDB.connect();

  try {
    await onlineClient.query("BEGIN");
    await offlineClient.query("BEGIN");

    for (let i = 0; i < users; i++) {
      const code = generateCode();
      await insertCode(onlineClient, code, "USER");
      await insertCode(offlineClient, code, "USER");
    }

    for (let i = 0; i < creators; i++) {
      const code = generateCode();
      await insertCode(onlineClient, code, "CREATOR");
      await insertCode(offlineClient, code, "CREATOR");
    }

    await onlineClient.query("COMMIT");
    await offlineClient.query("COMMIT");

    return { users, creators };
  } catch (err) {
    await onlineClient.query("ROLLBACK");
    await offlineClient.query("ROLLBACK");
    throw err;
  } finally {
    onlineClient.release();
    offlineClient.release();
  }
}

// **API route**
app.post("/generate-codes", async (req, res) => {
  const { users, creators } = req.body;

  try {
    const result = await generateBatch({ users, creators });
    res.json({ message: "Codes generated!", ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
