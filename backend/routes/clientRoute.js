import express from 'express';
import {
    getClients,
    getClientById,
    createClient,
} from '../controllers/clientController.js';

const router = express.Router();

router.get('/', getClients);
router.get('/:id', getClientById);

export default router;
