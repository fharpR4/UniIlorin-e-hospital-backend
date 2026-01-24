const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getAllPrescriptions,
  getPrescription,
  updatePrescription,
  dispensePrescription
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate, prescriptionSchema } = require('../middleware/validator');

router.use(protect);

router
  .route('/')
  .get(authorize('doctor', 'admin', 'patient'), getAllPrescriptions)
  .post(authorize('doctor'), validate(prescriptionSchema), createPrescription);

router
  .route('/:id')
  .get(getPrescription)
  .put(authorize('doctor'), updatePrescription);

router.put('/:id/dispense', authorize('admin'), dispensePrescription);

module.exports = router;