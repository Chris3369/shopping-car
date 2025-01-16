import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import authRoute from './routes/auth.route.js'
import productRoute from './routes/product.route.js'
import { connectDB } from './lib/db.js'

dotenv.config()

const app = express()

// allows you to parse the body of the request
app.use(express.json())

app.use(cookieParser())

app.use('/api/auth', authRoute)
app.use('/api/products', productRoute)

app.listen(process.env.PORT, () => {
    console.log(`SERVER START AT ${process.env.PORT}`)
    connectDB()
})