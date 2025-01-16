
import Coupon from '../models/coupon.model.js'
import { stripe } from '../lib/sstripe.js'

const createStripeCoupon = async (coupon) => {
    const stripeCoupon = await stripe.coupons.create({
        percent_off: coupon.discountPercentage,
        duration: 'once',
    })
    return stripeCoupon.id
}

const createNewCoupon = async (userId) => {
    const newCoupon = await Coupon.create({
        code: "GIFT" + Math.floor(Math.random() * 1000000).toString(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        userId,
    })

    await newCoupon.save()

    return newCoupon
}

export const createCheckoutSession = async (req, res) => {
    try {

        const { products, couponCode } = req.body

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'No products selected' })
        }

        let totalAmount = 0

        const lineItems = products.map(product => {

            // stripe expects amount in cents, so multiply by 100 to get cents => $10 * 100 = $1000
            const amount = Math.round(product.price * 100)
            totalAmount += amount * product.quantity

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        images: [product.image]
                    },
                    unit_amount: amount
                }
            }
        })

        let coupon = null
        if (couponCode) {
            coupon = await Coupon.findOne({
                code: couponCode,
                userId: req.user._id,
                isActive: true
            })

            if (coupon) {
                totalAmount -= Math.round(totalAmount * (coupon.discountPercentage / 100))
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}'`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: coupon ? [
                {
                    coupon: await createStripeCoupon(coupon)
                }
            ] : [],
            metadata: {
                userId: req.user._id,
                couponCode: couponCode || ""
            }
        })

        if (totalAmount >= 200 * 100) {
            await createNewCoupon(req.user._id)
        }

        res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 })

    } catch (error) {

    }
}