import Client from '../models/clientModel.js';  

export async function getClientById(req, res) {
    const { id } = req.params;
    const client = await Client.findById(id);
    res.status(200).json(client);
}

