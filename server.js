const path=require('path');
const http=require('http');
const express=require('express');
const socketio=require('socket.io');
const formatMessage=require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require('./utils/users');

const app=express();
const server=http.createServer(app);
const io=socketio(server);

//set static folder
app.use(express.static(path.join(__dirname,'public')));

const welcome='admin';

//run when client connects
io.on('connection',socket=>{
    //console.log('new ws connection');
    socket.on('joinRoom',({username,room})=>{

        const user=userJoin(socket.id,username,room);

        socket.join(user.room);

        socket.emit('message',formatMessage(welcome,'Welcome to the community'));

    //broadcast when user connects
    socket.broadcast.to(user.room).emit('message',formatMessage(welcome,`${user.username} joined the chat`));

    
    io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)
    });

    });



    //when client disconnects
    socket.on('disconnect',()=>{
        const user=userLeave(socket.id);
        if(user){
        io.to(user.room).emit('message',formatMessage(welcome,`${user.username} left the chat`));
        
        io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)
            });
        }
    });

    //listen for chat msg
    socket.on('chatMessage',msg=>{
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });
});

const PORT=3000||process.env.PORT;
server.listen(PORT,()=>console.log(`Server running on port ${PORT} `));