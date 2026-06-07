import Client from '../config/clientShema.js';
import mongoose from 'mongoose';

export async function getClientById(req, res) {
  try {
    const { id } = req.params;
    let client = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      client = await Client.findById(id);
    }

    if (!client) {
      client = await Client.findOne({ customer_id: id });
    }

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    return res.status(200).json(client);
  } catch (error) {
    console.error("Error in getClientById controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const searchClients = async (req, res) => {
  try {
    const searchString = req.query.q; // e.g., /api/clients/search?q=Acme

    if (!searchString || searchString.trim() === '') {
      return res.status(200).json([]);
    }

    const db = mongoose.connection.db;

    // 2. The Atlas Search Aggregation Pipeline
    const results = await db.collection("clients").aggregate([
      {
        $search: {
          index: "default", // The name of your Atlas Search index
          text: {
            query: searchString,
            path: "customer_id",
            fuzzy: {
              maxEdits: 1 // Forgiving to typos (e.g., "Acm" -> "Acme")
            }
          }
        }
      },
      {
        $limit: 5 // Crucial for performance with 300k records
      },

    ]).toArray();

    // 3. Send successful response
    return res.status(200).json(results);

  } catch (error) {
    console.error("Error in searchClients controller:", error);
    return res.status(500).json({ error: "Internal server error during search" });
  }
};
