import Client from '../config/clientShema.js';
import mongoose from 'mongoose';

export async function getClientById(req, res) {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    
    let history = [];

    // If it is a valid ObjectId, search by _id first to get customer_id
    if (mongoose.Types.ObjectId.isValid(id)) {
      const byId = await db.collection("clients").findOne({ _id: new mongoose.Types.ObjectId(id) });
      if (byId && byId.customer_id) {
        history = await db.collection("clients").find({ customer_id: byId.customer_id }).sort({ calmonth: 1 }).toArray();
      }
    }

    // If not found or not ObjectId, search by customer_id directly
    if (history.length === 0) {
      history = await db.collection("clients").find({ customer_id: id }).sort({ calmonth: 1 }).toArray();
    }

    if (history.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    // The latest record is the last one in the history array (since history is sorted by calmonth ascending)
    const latestClient = history[history.length - 1];

    return res.status(200).json({
      client: latestClient,
      history: history
    });
  } catch (error) {
    console.error("Error in getClientById controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const searchClients = async (req, res) => {
  try {
    const { q, territorio, subchannel, tamano, risk } = req.query;

    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    // 1. Search term on customer_id
    if (q && q.trim() !== '') {
      query.customer_id = { $regex: q.trim(), $options: 'i' };
    }

    // 2. Territory filter
    if (territorio && territorio.trim() !== '') {
      query.territory_d = territorio.trim();
    }

    // 3. Subchannel filter
    if (subchannel && subchannel.trim() !== '') {
      query.comercial_subchannel_d = subchannel.trim();
    }

    // 4. Size filter
    if (tamano && tamano !== 'All' && tamano.trim() !== '') {
      query.rtm_customer_size_d = tamano.trim();
    }

    // 5. Risk tier filter
    if (risk && risk !== 'All' && risk.trim() !== '') {
      if (risk === 'High') {
        query.prob_churn = { $gte: 0.75 };
      } else if (risk === 'Medium') {
        query.prob_churn = { $gte: 0.50, $lt: 0.75 };
      } else if (risk === 'Low') {
        query.prob_churn = { $lt: 0.50 };
      }
    }

    // Fetch matching clients with pagination and get total count
    const [clients, total] = await Promise.all([
      Client.find(query).skip(skip).limit(limit).lean(),
      Client.countDocuments(query)
    ]);

    // Map properties from DB schema to frontend expected fields
    const mappedClients = clients.map(client => ({
      cliente_id: client.customer_id,
      churn_score: client.prob_churn,
      territorio: client.territory_d,
      subchannel: client.comercial_subchannel_d,
      tamano: client.rtm_customer_size_d,
      razones: client.razones,
      propuestas: client.propuestas,
      nivel_riesgo: client.nivel_riesgo
    }));

    return res.status(200).json({
      clients: mappedClients,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });

  } catch (error) {
    console.error("Error in searchClients controller:", error);
    return res.status(500).json({ error: "Internal server error during search" });
  }
};

export const getClientFilters = async (req, res) => {
  try {
    const [territorios, subchannels] = await Promise.all([
      Client.distinct('territory_d'),
      Client.distinct('comercial_subchannel_d')
    ]);

    const sortedTerritorios = territorios.filter(Boolean).sort();
    const sortedSubchannels = subchannels.filter(Boolean).sort();

    return res.status(200).json({
      territorios: sortedTerritorios,
      subchannels: sortedSubchannels
    });
  } catch (error) {
    console.error("Error in getClientFilters controller:", error);
    return res.status(500).json({ error: "Internal server error retrieving filters" });
  }
};
