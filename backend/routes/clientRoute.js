import express from 'express';
import {
    getClientById,
    searchClients, 
} from '../controllers/clientController.js';

const router = express.Router();

router.get('/search', searchClients);
router.get('/:id', getClientById);




export default router;
