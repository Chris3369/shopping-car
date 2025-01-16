import Product from "../models/product.model.js"

export const addToCart = async (req, res) => {
    try {
        const productId = req.body.productId
        const user = req.user

        const item = user.cartItems.find(item => item.id === productId)
        if (item) {
            item.quantity++
        } else {
            user.cartItems.push(productId)
        }

        await user.save()
        res.json(user.cartItems)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const removeAllFromCart = async (req, res) => {
    try {
        const productId = req.body.productId
        const user = req.user

        if (!productId) {
            user.cartItems = []
        } else {
            user.cartItems = user.cartItems.filter(item => item.id !== productId)
        }

        await user.save()
        res.json(user.cartItems)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateQuantity = async (req, res) => { 
    try {
        const id = req.params.id
        const quantity = req.body.quantity
        const user = req.user
        const item = user.cartItems.find(item => item.id === id)

        if (item) {
            if (quantity <= 0) {
                user.cartItems = user.cartItems.filter(item => item.id !== id)
            } else {
                item.quantity = quantity
            }

            await user.save()
            res.json(user.cartItems)
        } else {
            res.status(404).json({ message: 'Product not found' })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getCartProducts = async (req, res) => { 
    try {
        const products = Product.find({ _id: { $in: req.user.cartItems } })

        // add quantity to each product
        const cartItems = products.map(product => {
            const item = req.user.cartItems.find(item => item.id === product.id)
            return {
                ...product,
                quantity: item.quantity
            }
        })

        res.json(cartItems)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}