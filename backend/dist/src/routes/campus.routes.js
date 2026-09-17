"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campus_controller_1 = require("../controllers/campus.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public / Authenticated read
router.get('/', campus_controller_1.getCampuses);
router.get('/:id', campus_controller_1.getCampusById);
// Admin-only management
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN'), campus_controller_1.createCampus);
router.patch('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN'), campus_controller_1.updateCampus);
router.patch('/:id/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMIN'), campus_controller_1.toggleCampusStatus);
exports.default = router;
