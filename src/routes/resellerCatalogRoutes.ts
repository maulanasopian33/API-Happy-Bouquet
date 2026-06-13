import { Router } from 'express';
import * as ctrl from '../controllers/resellerCatalogController';

const router = Router();

// Public reseller catalog endpoints
router.get('/:slug', ctrl.getCatalog);
router.get('/:slug/products/:productId(\\d+)', ctrl.getProductDetail);
router.get('/:slug/whatsapp-link/:productId(\\d+)', ctrl.getWhatsappLink);

export default router;
