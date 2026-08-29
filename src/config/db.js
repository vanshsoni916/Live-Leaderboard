import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function connectDB(){
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log(`Database is connected`)
    } catch (err) {
        console.error(`Database Connection error:${err}`)
        process.exit(1)
    }
}

export {connectDB}