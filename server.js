var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , gpio = require('pi-gpio')

//All clients have a common status
var commonStatus = 'OFF';

app.listen(3000);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
    
    //Send client with his socket id
    socket.emit('your id', 
        { id: socket.id});
    
    //Info all clients a new client caaonnected
    io.sockets.emit('on connection', 
        { client: socket.id,
          clientCount: io.sockets.clients().length,
        });
        
    //Set the current common status to the new client
    socket.emit('ack button status', { status: commonStatus });
    
    socket.on('button update event', function (data) {
        console.log(data.status);
        
        gpio.open(16, "output", function(err) {
        
            //acknowledge with inverted status, 
            //to toggle button text in client
            if(data.status == 'ON'){
                console.log("ON->OFF");
                commonStatus = 'OFF';
                gpio.write(16, 0);
            }else{
                console.log("OFF->ON");
                commonStatus = 'ON';
                gpio.write(16, 1);
            }
            io.sockets.emit('ack button status', 
                { status: commonStatus,
                  by: socket.id
                });
        });
    });
    
    //Info all clients if this client disconnect
    socket.on('disconnect', function () {
        io.sockets.emit('on disconnect', 
            { client: socket.id,
              clientCount: io.sockets.clients().length-1,
            });
    });
});
