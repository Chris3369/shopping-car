import express from 'express'
import { getProducts } from '../controllers/product.controller.js'
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', protectRoute, adminRoute, getProducts)

export default router