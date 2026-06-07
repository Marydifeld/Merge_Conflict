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
    const { q, territory, subchannel, size, risk } = req.query;
    const db = mongoose.connection.db;

    const matchStage = {};

    // 1. Client Search Term (case-insensitive regex prefix match)
    if (q && q.trim() !== '') {
      matchStage.customer_id = { $regex: "^" + q.trim(), $options: "i" };
    }

    // 2. Territory filter
    if (territory && territory.trim() !== '') {
      matchStage.territory_d = territory.trim();
    }

    // 3. Subchannel filter
    if (subchannel && subchannel.trim() !== '') {
      matchStage.comercial_subchannel_d = subchannel.trim();
    }

    // 4. Size filter
    if (size && size.trim() !== '' && size !== 'All') {
      matchStage.rtm_customer_size_d = size.trim();
    }

    // 5. Risk level filter
    if (risk && risk.trim() !== '' && risk !== 'All') {
      if (risk === 'High') {
        matchStage.prob_churn = { $gte: 0.75 };
      } else if (risk === 'Medium') {
        matchStage.prob_churn = { $gte: 0.50, $lt: 0.75 };
      } else if (risk === 'Low') {
        matchStage.prob_churn = { $lt: 0.50 };
      }
    }

    // Check if we have any active filters. If not, return the default mixed list
    const hasFilters = Object.keys(matchStage).length > 0;
    
    if (!hasFilters) {
      const results = await db.collection("clients").aggregate([
        { $sort: { customer_id: 1, calmonth: -1 } },
        {
          $group: {
            _id: "$customer_id",
            customer_id: { $first: "$customer_id" },
            prob_churn: { $first: "$prob_churn" },
            estado: { $first: "$estado" },
            territory_d: { $first: "$territory_d" },
            comercial_subchannel_d: { $first: "$comercial_subchannel_d" },
            rtm_customer_size_d: { $first: "$rtm_customer_size_d" },
            num_coolers: { $first: "$num_coolers" },
            num_doors: { $first: "$num_doors" },
            nivel_riesgo: { $first: "$nivel_riesgo" },
            razones: { $first: "$razones" },
            propuestas: { $first: "$propuestas" },
            calmonth: { $first: "$calmonth" }
          }
        },
        { $sort: { prob_churn: -1 } }
      ]).toArray();

      return res.status(200).json(results);
    }

    // Otherwise, perform filtered aggregation on the database
    let results = [];
    try {
      if (q && q.trim() !== '') {
        const searchStage = {
          $search: {
            index: "default",
            wildcard: {
              query: `${q.trim()}*`,
              path: "customer_id",
              allowAnalyzedField: true
            }
          }
        };

        // Combine Atlas Search with other filter matches
        const additionalMatch = { ...matchStage };
        delete additionalMatch.customer_id; // Handled by $search

        const pipeline = [searchStage];
        if (Object.keys(additionalMatch).length > 0) {
          pipeline.push({ $match: additionalMatch });
        }

        pipeline.push(
          { $sort: { customer_id: 1, calmonth: -1 } },
          {
            $group: {
              _id: "$customer_id",
              customer_id: { $first: "$customer_id" },
              prob_churn: { $first: "$prob_churn" },
              estado: { $first: "$estado" },
              territory_d: { $first: "$territory_d" },
              comercial_subchannel_d: { $first: "$comercial_subchannel_d" },
              rtm_customer_size_d: { $first: "$rtm_customer_size_d" },
              num_coolers: { $first: "$num_coolers" },
              num_doors: { $first: "$num_doors" },
              nivel_riesgo: { $first: "$nivel_riesgo" },
              razones: { $first: "$razones" },
              propuestas: { $first: "$propuestas" },
              calmonth: { $first: "$calmonth" }
            }
          },
          { $sort: { prob_churn: -1 } }
        );

        results = await db.collection("clients").aggregate(pipeline).toArray();
      } else {
        // Direct match pipeline when no search term is entered
        results = await db.collection("clients").aggregate([
          { $match: matchStage },
          { $sort: { customer_id: 1, calmonth: -1 } },
          {
            $group: {
              _id: "$customer_id",
              customer_id: { $first: "$customer_id" },
              prob_churn: { $first: "$prob_churn" },
              estado: { $first: "$estado" },
              territory_d: { $first: "$territory_d" },
              comercial_subchannel_d: { $first: "$comercial_subchannel_d" },
              rtm_customer_size_d: { $first: "$rtm_customer_size_d" },
              num_coolers: { $first: "$num_coolers" },
              num_doors: { $first: "$num_doors" },
              nivel_riesgo: { $first: "$nivel_riesgo" },
              razones: { $first: "$razones" },
              propuestas: { $first: "$propuestas" },
              calmonth: { $first: "$calmonth" }
            }
          },
          { $sort: { prob_churn: -1 } }
        ]).toArray();
      }
    } catch (searchError) {
      console.warn("Search aggregation query failed, running standard regex match fallback:", searchError.message);
      // Fallback regex match query
      results = await db.collection("clients").aggregate([
        { $match: matchStage },
        { $sort: { customer_id: 1, calmonth: -1 } },
        {
          $group: {
            _id: "$customer_id",
            customer_id: { $first: "$customer_id" },
            prob_churn: { $first: "$prob_churn" },
            estado: { $first: "$estado" },
            territory_d: { $first: "$territory_d" },
            comercial_subchannel_d: { $first: "$comercial_subchannel_d" },
            rtm_customer_size_d: { $first: "$rtm_customer_size_d" },
            num_coolers: { $first: "$num_coolers" },
            num_doors: { $first: "$num_doors" },
            nivel_riesgo: { $first: "$nivel_riesgo" },
            razones: { $first: "$razones" },
            propuestas: { $first: "$propuestas" },
            calmonth: { $first: "$calmonth" }
          }
        },
        { $sort: { prob_churn: -1 } }
      ]).toArray();
    }

    return res.status(200).json(results);

  } catch (error) {
    console.error("Error in searchClients controller:", error);
    return res.status(500).json({ error: "Internal server error during search" });
  }
};

export async function getTopClients(req, res) {
  try {
    const db = mongoose.connection.db;
    
    // Group all clients by customer_id, pick their latest month record, and sort by risk descending
    const results = await db.collection("clients").aggregate([
      { $sort: { customer_id: 1, calmonth: -1 } },
      {
        $group: {
          _id: "$customer_id",
          customer_id: { $first: "$customer_id" },
          prob_churn: { $first: "$prob_churn" },
          estado: { $first: "$estado" },
          territory_d: { $first: "$territory_d" },
          comercial_subchannel_d: { $first: "$comercial_subchannel_d" },
          rtm_customer_size_d: { $first: "$rtm_customer_size_d" },
          num_coolers: { $first: "$num_coolers" },
          num_doors: { $first: "$num_doors" },
          nivel_riesgo: { $first: "$nivel_riesgo" },
          razones: { $first: "$razones" },
          propuestas: { $first: "$propuestas" },
          calmonth: { $first: "$calmonth" }
        }
      },
      { $sort: { prob_churn: -1 } }
    ]).toArray();

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error in getTopClients controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

