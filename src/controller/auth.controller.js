import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { User } from '../model/user.model.js'


function generateToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    )
}

async function registerUser(req, res) {
    try {
        const { username, email, password } = req.body
        if (!username || !email || !password) {
            return res
                .status(400)
                .json(
                    {
                        error: "all fields are required"
                    }
                )
        }

        const existing = await User.findOne({ $or: [{ username }, { email }] })
        if (existing) {
            return res
                .status(409)
                .json(
                    { message: "User already exist" }
                )
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await User.create({
            username: username,
            email: email,
            passwordHash: passwordHash
        })

        const token = generateToken(user?._id)
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000
        }

        return res
            .status(201)
            .cookie("token", token, options)
            .json({
                username: user.username,
                email: user.email
            })
    } catch (err) {
        console.log(`registration failed !`, err)
        return res
            .status(500)
            .json({
                error: "Internal Server Error"
            })
    }
}

async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body
    if (!username && !email) {
        return res
            .status(400)
            .json({
                message: "email or username required !"
            })
    }
    if (!password) {
        return res
            .status(400)
            .json({
                message: "password required !"
            })
    }

    const user = await User.findOne({ email })
    if (!user) {
        return res.status(401).json({ error: "Invalid Credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
        return res.status(401).json({ error: "Invalid Credentials" })
    }

    const token = generateToken(user?._id)
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000
    }
    return res
        .status(200)
        .cookie("token", token, options)
        .json({
            username: user.username,
            email: user.email
        })
    } catch (err) {
        console.log(`login failed !`, err)
        return res
            .status(500)
            .json({
                error: "Internal Server Error"
            })
    }
}

export{
    registerUser,
    loginUser
}