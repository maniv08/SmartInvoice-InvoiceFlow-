import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  checkDuplicate,
  uploadAttachment,
  bulkApprove,
  bulkReject,
  bulkCsvImport,
  parseInvoiceDocument,
  matchInvoiceWithPO,
  validateInvoiceGST,
} from '../controllers/invoiceController';
import { authenticateJWT } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { upload } from '../middleware/upload';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  duplicateCheckSchema,
  invoiceQuerySchema,
} from '../schemas/invoiceSchemas';

const router = Router();

router.use(authenticateJWT);

router.get('/', validateRequest(invoiceQuerySchema, 'query'), getInvoices);
router.post('/check-duplicate', validateRequest(duplicateCheckSchema), checkDuplicate);
router.post('/parse-ocr', upload.single('file'), parseInvoiceDocument);
router.post('/match-po', matchInvoiceWithPO);
router.post('/validate-gst', validateInvoiceGST);
router.post('/', validateRequest(createInvoiceSchema), createInvoice);
router.post('/bulk-approve', requireRoles('ADMIN', 'FINANCE_MANAGER', 'APPROVER'), bulkApprove);
router.post('/bulk-reject', requireRoles('ADMIN', 'FINANCE_MANAGER', 'APPROVER'), bulkReject);
router.post('/bulk-import', requireRoles('ADMIN', 'FINANCE_MANAGER'), bulkCsvImport);

router.get('/:id', getInvoiceById);
router.put('/:id', validateRequest(updateInvoiceSchema), updateInvoice);
router.delete('/:id', deleteInvoice);
router.post('/:id/attachments', upload.single('file'), uploadAttachment);

export default router;
