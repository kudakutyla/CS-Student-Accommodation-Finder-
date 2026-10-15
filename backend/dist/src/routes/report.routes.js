"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/mine', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('STUDENT'), report_controller_1.getMyReports);
exports.default = router;
