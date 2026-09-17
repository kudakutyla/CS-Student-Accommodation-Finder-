"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Strictly ADMIN-only
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN'));
router.get('/listings/pending', admin_controller_1.getPendingListings);
router.patch('/listings/:id/approve', admin_controller_1.approveListing);
router.patch('/listings/:id/reject', admin_controller_1.rejectListing);
router.get('/stats', admin_controller_1.getAdminStats);
exports.default = router;
