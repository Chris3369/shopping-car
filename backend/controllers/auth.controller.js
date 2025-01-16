import jwt from 'jsonwebtoken'
import User from "../models/user.model.js"
import { redis } from '../lib/redis.js'

const generateTokens = (id) => {
    const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    })

    const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    })

    return { accessToken, refreshToken }
}

const storeRefreshToken = async (id, refreshToken) => {
    try {
        await redis.set(`refresh_token:${id}`, refreshToken, "EX", 60 * 60 * 24 * 7)
    } catch (error) {
        console.log(error)
    }
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // prevent xss attacks
        sameSite: 'strict', // prevent csrf attacks
        maxAge: 15 * 60 * 1000
    })

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

export const signup = async (req, res) => {
    const { email, password, name } = req.body

    try {
        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' })
        }

        const user = await User.create({
            email,
            password,
            name
        })

        // authenticate the user
        const { accessToken, refreshToken } = generateTokens(user._id)

        // store the refresh token in redis
        await storeRefreshToken(user._id, refreshToken)

        setCookies(res, accessToken, refreshToken)

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            message: 'User created successfully'
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (user && await user.comparePassword(password)) {
            const { accessToken, refreshToken } = generateTokens(user._id)

            await storeRefreshToken(user._id, refreshToken)
            setCookies(res, accessToken, refreshToken)

            res.status(200).json({
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                message: 'User logged in successfully'
            })
        } else {
            res.status(401).json({ message: 'Invalid email or password' })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
            await redis.del(`refresh_token:${decoded.id}`)
        }

        res.clearCookie('accessToken')
        res.clearCookie('refreshToken')
        res.json({ message: 'Logged out successfully' })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' })
        }
        
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const storedToken = await redis.get(`refresh_token:${decoded.id}`)

        if (refreshToken !== storedToken) {
            return res.status(401).json({ message: 'Invalid refresh token' })
        }

        const accessToken = jwt.sign({ id: decoded.id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '15m'
        })

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        })

        res.status(200).json({ message: 'Refresh token updated successfully' })
   
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getProfile = async (req, res) => {
    
}