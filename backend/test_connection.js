import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })
import mongoose from 'mongoose'
import Client from './config/clientShema.js'

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // Check count of clients
    const count = await Client.countDocuments();
    console.log("Client count:", count);

    // Get one client
    const oneClient = await Client.findOne();
    console.log("One client:", oneClient);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
