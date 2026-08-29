import express from 'express'
import {Server} from 'socket.io'
import cors from 'cors'
import {connectRedis} from './config/redisClient.js'
import http from 'http'
import { connectDB } from './config/db.js'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cors({
    origin:process.env.ORIGIN,
    credentials:true
}))

app.use(express.json())
app.use(cookieParser())

import authRoutes from './routes/auth.routes.js'
app.use('/api/auth',authRoutes)

const server = http.createServer(app)

const io = new Server(server,{cors:{origin:'*'}})

async function start(){
    await connectRedis()
    await connectDB()
    server.listen(process.env.PORT || 5000,()=>{
        console.log(`Server is listening on port ${process.env.PORT || 5000}`)
    })
}

start()