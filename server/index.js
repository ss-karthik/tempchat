import express from "express"
import {createServer} from "node:http"
import { Server } from 'socket.io';
import cors from "cors"

const port = 3000;
const app = express()
app.use(cors());
const server = createServer(app)
const io = new Server(server, {
    cors:{
        origin: "http://localhost:5173"
    }
});

const userData = {};
io.on("connection", (socket)=>{
    const { room, userName } = socket.handshake.query;
    socket.join(room);
    console.log(`user ${userName} with ID ${socket.id} has connected to room ${room}`);
    if(!userData[room]){
        userData[room]= [];
    }
    if (!userData[room].includes(userName)) {
        userData[room] = [...userData[room], userName];
    }

    io.to(room).emit("new connection", userName, userData[room]||[]);

    socket.on("message", (chatObj)=>{
        io.to(chatObj.room).emit("message", 
            {room: chatObj.room, userName : chatObj.userName, message : chatObj.message});
    });
    socket.on("disconnect", ()=>{
        const { room, userName } = socket.handshake.query;
        console.log(`user ${userName} with ID ${socket.id} has disconnected from room ${room}`);
        if (userData[room]) { 
            userData[room] = userData[room].filter(user => user !== userName);
        }
        if (userData[room].length === 0) {
            delete userData[room];
        }

        io.to(room).emit("user disconnected", userName, userData[room]||[]);
    });
});

app.get("/", (req,res)=>{
    res.send("tempchat server");
})

server.listen(port, ()=>{
    console.log(`Listening at port ${port}`);
})