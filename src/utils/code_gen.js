import { offlineDB, onlineDB } from "../db.js";
import crypto from 'crypto';
import { configDotenv } from "dotenv";
import { use } from "react";

function generateCode() {
    return 'XENON-' + crypto.randomBytes(12).toString('hex').toUpperCase();
}
async function emergentTable(client) {
    const query = `CREATE TABLE codes(code_string PRIMARY KEY UNIQUE, account_type TEXT CHECK(account_type IN('USER', 'CREATOR')), is_bought BOOLEAN DEFAULT FALSE, bought_at TIMESTAMP);`

    await client.query(query)

}
await emergentTable(offlineDB);
await emergentTable(onlineDB);
async function insertName(client, code, type) {
    const query = `INSERT INTO codes (code_string, account_type) VALUES ($1, $2)`
    await client.query(query, [code, type])
}

export async function generateBaches({users = 0, creators = 0}) {
    const onlineDBClient = await onlineDB.connect();
    const offlineDBClient = await offlineDB.connect();

    try{
        await onlineDBClient.query('BEGIN')
        await offlineDBClient.query('BEGIN')

        for(i = 0; i < users; i++){
            const code = generateCode();
            await insertName(onlineDBClient, code, "USER")
            await insertName(offlineDBClient, code, "USER")
        }
        for(i = 0; i < creators; i++){
            const code = generateCode();
            await insertName(onlineDBClient, code, "CREATOR")
            await insertName(offlineDBClient, code, "CREATOR")
        }
        await offlineDBClient('COMMIT')
        await onlineDBClient('COMMIT')

        console.log(`generated ${users} USER codes and ${creators} CREATOR code`)
    }
    catch(err){
        await offlineDBClient('ROLLBACK')
        await onlineDBClient('ROLLBACK')
        console.error(err.message)
    }
    finally{
        onlineDBClient.release();
        offlineDBClient.release();
    }
}

