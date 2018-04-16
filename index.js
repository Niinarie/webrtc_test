const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();

const sslkey = fs.readFileSync('key.pem');
const sslcert = fs.readFileSync('cert.pem');

const options = {
  key: sslkey,
  cert: sslcert,
};

app.use(express.static('public'));
app.use('/modules', express.static('node_modules'));

const server = https.createServer(options, app);
const io = require('socket.io')(server); 

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('call', (msg) => {
    console.log(msg);
    socket.broadcast.emit('call', msg);
  })

  socket.on('answer', (msg) => {
    socket.broadcast.emit('call answered', msg)
  })

  socket.on('candidate', (msg) => {
    console.log('candidate message recieved!');
    socket.broadcast.emit('candidate', msg);
  });

  socket.on('deny', (msg) => {
    socket.broadcast.emit('deny', msg);
  })
});


server.listen(3000);
