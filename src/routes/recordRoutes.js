const express = require('express');
const router = express.Router();
const {
  createMedicalRecord,
  getAllMedicalRecords,
  getMedicalRecord,
  updateMedicalRecord
} = require('../controllers/recordController');
const { protect } = require('../middleware/auth');
const { authorize, canAccessPatientData } = require('../middleware/roleCheck');
const { validate, medicalRecordSchema } = require('../middleware/validator');

router.use(protect);

router
  .route('/')
  .get(authorize('doctor', 'admin'), getAllMedicalRecords)
  .post(authorize('doctor'), validate(medicalRecordSchema), createMedicalRecord);

router
  .route('/:id')
  .get(canAccessPatientData, getMedicalRecord)
  .put(authorize('doctor'), updateMedicalRecord);

module.exports = router;