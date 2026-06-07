import express from 'express';
import { initiateOutboundCall } from '../controllers/elevenlabsController.js';

const router = express.Router();

router.post('/outbound-call', initiateOutboundCall);

export default router;