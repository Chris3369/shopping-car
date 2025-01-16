import Product from '../models/product.model.js'

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find() // find all products
        res.json(products)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}   