import express from 'express';
import {
    getClientById,
    searchClients, 
    getClientFilters,
} from '../controllers/clientController.js';

const router = express.Router();

router.get('/search', searchClients);
router.get('/filters', getClientFilters);
router.get('/:id', getClientById);

export default router;
