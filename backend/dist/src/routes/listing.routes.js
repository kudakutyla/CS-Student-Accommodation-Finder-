"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listing_controller_1 = require("../controllers/listing.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public listings search
router.get('/', listing_controller_1.getPublicListings);
// Landlord's own listings (Must come before /:id)
router.get('/my', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('LANDLORD'), listing_controller_1.getMyListings);
// Specific listing detail (public or authenticated)
router.get('/:id', listing_controller_1.getListingById);
// Landlord listing creation (strictly requires verified landlord)
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('LANDLORD'), auth_middleware_1.requireVerifiedLandlord, listing_controller_1.createListing);
// Listing management
router.patch('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('LANDLORD', 'ADMIN'), listing_controller_1.updateListing);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('LANDLORD', 'ADMIN'), listing_controller_1.deleteListing);
exports.default = router;
