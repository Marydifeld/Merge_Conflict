import express from 'express';
import {
    getClientById,
    searchClients, 
    getTopClients,
} from '../controllers/clientController.js';

const router = express.Router();

router.get('/search', searchClients);
router.get('/', getTopClients);
router.get('/:id', getClientById);




export default router;
