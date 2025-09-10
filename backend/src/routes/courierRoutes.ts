import { Router } from 'express';
import { CourierController } from '../controllers/courierController';
import { validateLogoUpload } from '../middleware/upload';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();
const courierController = new CourierController();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/couriers - Get all couriers
router.get('/', courierController.getCouriers.bind(courierController));

// GET /api/couriers/:id - Get courier by ID
router.get('/:id', courierController.getCourierById.bind(courierController));

// POST /api/couriers - Create new courier (with optional logo upload)
router.post('/', 
  (req, res, next) => {
    req.params.type = 'couriers';
    next();
  },
  validateLogoUpload, 
  courierController.createCourier.bind(courierController)
);

// PUT /api/couriers/:id - Update courier (with optional logo upload)
router.put('/:id', 
  (req, res, next) => {
    req.params.type = 'couriers';
    next();
  },
  validateLogoUpload, 
  courierController.updateCourier.bind(courierController)
);

// POST /api/couriers/:id/logo - Upload logo for existing courier
router.post('/:id/logo', 
  (req, res, next) => {
    req.params.type = 'couriers';
    next();
  },
  validateLogoUpload, 
  courierController.uploadLogo.bind(courierController)
);

// DELETE /api/couriers/:id - Delete courier
router.delete('/:id', courierController.deleteCourier.bind(courierController));

export default router;
