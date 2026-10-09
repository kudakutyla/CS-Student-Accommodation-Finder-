"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listing_controller_1 = require("../controllers/listing.controller");
const review_controller_1 = require("../controllers/review.controller");
const report_controller_1 = require("../controllers/report.controller");
const upload_middleware_1 = require("../middleware/upload.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public listings search
router.get('/', listing_controller_1.getPublicListings);
// Landlord's own listings (Must come before /:id)
router.get('/my', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('LANDLORD'), listing_controller_1.getMyListings);
// Specific listing detail (public or authenticated)
router.get('/:id', auth_middleware_1.authenticateOptional, listing_controller_1.getListingById);
router.get('/:id/reviews', review_controller_1.getListingReviews);
router.post('/:id/reviews', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('STUDENT'), review_controller_1.createReview);
router.post('/:id/reports', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('STUDENT'), report_controller_1.createReport);
// Landlord listing creation (strictly requires verified landlord)
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('LANDLORD'), auth_middleware_1.requireVerifiedLandlord, upload_middleware_1.listingPhotosUpload, listing_controller_1.createListing);
// Listing management
router.patch('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('LANDLORD', 'ADMIN'), listing_controller_1.updateListing);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('LANDLORD', 'ADMIN'), listing_controller_1.deleteListing);
exports.default = router;
