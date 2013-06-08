var io = require('socket.io').listen(80);

io.sockets.on('connection', function (socket) {
  // TODO: send 'client:update' to all sockets for this new connection

  socket.on('login', function (data) {
    socket.username = data.username;
    socket.pubkey = data.pubkey;
    socket.emit('login:reply', {
      status: "ok"
      // TODO: Iterate over sockets, compile a list of clients
    });
  });
  socket.on('send:message', function (data) {
    // TODO: Iterate over sockets, find socket with username data.username, and send it to them, then send reply on success
    socket.emit('send:message', {
      status: "ok"
    });
    console.log(data);
  });

});