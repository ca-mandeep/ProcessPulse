const express = require('express');
const router = express.Router();
const { 
  upload, 
  uploadFile, 
  processImport, 
  getImportHistory,
  clearAllData 
} = require('../controllers/importController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.post('/process/:importId', processImport);
router.get('/history', getImportHistory);
router.delete('/clear', clearAllData);

module.exports = router;
