import express from 'express'
import dotenv from 'dotenv'
import authRoute from './routes/auth.route.js'
import { connectDB } from './lib/db.js'

dotenv.config()

const app = express()

// allows you to parse the body of the request
app.use(express.json())

app.use('/api/auth', authRoute)


app.listen(process.env.PORT, () => {
    console.log(`SERVER START AT ${process.env.PORT}`)

    connectDB()
})