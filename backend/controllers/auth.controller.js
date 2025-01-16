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
    res.send('login')
}

export const logout = async (req, res) => {
    res.send('logout')
}