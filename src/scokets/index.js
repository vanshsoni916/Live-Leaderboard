import { redisClient } from '../config/redisClient.js'
import { createAdapter } from '@socket.io/redis-adapter'

const LEADERBOARD_KEY = 'leaderboard:global'

async function setupRedisAdapter(io) {
    const pubClient = redisClient.duplicate()
    const subClient = redisClient.duplicate()

    await Promise.all([pubClient.connect(), subClient.connect()])
    io.adapter(createAdapter(pubClient, subClient))
    console.log("Socket.io Redis adapter connected!")
}
const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Client Connected: ', socket.id)

        socket.on('disconnected', () => {
            console.log('Client Disconnected: ', socket.id)
        })
    })
}

let broadcastPending = false;

const broadcastLeaderboardUpdate = async (io) => {
    if (broadcastPending) return;
    broadcastPending = true;

    setTimeout(async () => {
        try {
            const top = await redisClient.zRangeWithScores(LEADERBOARD_KEY, 0, 9, { REV: true })
            io.emit('leaderboard:update', { top })
        } catch (err) {
            console.log("Broadcast Failed!!")
        } finally {
            broadcastPending = false
        }
    }, 500)
}

export { initSocket, broadcastLeaderboardUpdate, setupRedisAdapter}