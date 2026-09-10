import {redisClient} from '../config/redisClient.js'

const LEADERBOARD_KEY = 'leaderboard:global'

const initSocket = (io)=>{
    io.on('connection',(socket)=>{
        console.log('Client Connected: ', socket.id)

        socket.on('disconnected',()=>{
            console.log('Client Disconnected: ', socket.id)
        })
    })
}

const broadcastLeaderboardUpdate = async(io)=>{
    const top = await redisClient.zRangeWithScores(LEADERBOARD_KEY,0,9,{REV:true})
    io.emit('leaderboard:update',{top})
}

export {initSocket,broadcastLeaderboardUpdate}