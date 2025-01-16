import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

export const protectRoute = async (req, res, next) => { 
    try {
        const accessToken = req.cookies.accessToken
        if (!accessToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decoded.id).select('-password') // exclude password from response

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        req.user = user
        next()
    
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const adminRoute = (req, res, next) => { 
    if (req.user && req.user.role === 'admin') {
        next()
    } else {
        return res.status(403).json({ message: 'Unauthorized' })
    }
}