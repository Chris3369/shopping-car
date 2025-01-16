import Product from '../models/product.model.js'
import { redis } from '../lib/redis.js'
import cloudinary from '../lib/cloudinary.js'

const updateFeaturedProductsCache = async () => {
    try {
        const products = await Product.find({ isFeatured: true }).lean()
        await redis.set('featured_products', JSON.stringify(products))
    } catch (error) {
    }
}

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find() // find all products
        res.json(products)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        let products = await redis.get('featured_products')
        if (products) {
            return res.json(JSON.parse(products))
        }

        // if not in redis, get from db
        // lean is used to convert to js object
        products = await Product.find({ isFeatured: true }).lean()
        if (!products) {
            res.status(404).json({ message: 'No featured products found' })
        }

        // store in redis for future quick access
        await redis.set('featured_products', JSON.stringify(products))
        res.json(products)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, image } = req.body

        let cloudinaryResponse = null

        if (image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: 'products' })
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : ""
        })

        res.status(201).json(product)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        if (product.image) {
            const imageId = product.image.split('/').pop().split('.')[0]

            try {
                await cloudinary.uploader.destroy(`products/${imageId}`)
            } catch (error) {
                console.log(error)
            }
        }

        await Product.findByIdAndDelete(req.params.id)
        res.json({ message: 'Product deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getRecommendedProducts = async (req, res) => {

}

export const getProductsByCategory = async (req, res) => {
    
    const category = req.params.category
    
    try {
        const products = await Product.find({ category })
        res.json(products)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (product) {
            product.isFeatured = !product.isFeatured
            const updatedProduct = await product.save()

            await updateFeaturedProductsCache()
            
            res.json(updatedProduct)
        } else{
            res.status(404).json({ message: 'Product not found' })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}