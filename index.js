var express = require('express');
var http = require('http');
var ws = require('ws');
var uuid = require('uuid');
const jwt = require("jsonwebtoken");
var cors = require('cors')

const app = express();
app.use(express.static(`${__dirname}/static`));
app.locals.connections = [];
app.use(cors())

const server = http.createServer(app);
const wss = new ws.Server({ server });

data={
    type:"",
    enable:false,
    value:""
}

function broadcastConnections() {
    let ids = app.locals.connections.map(c => c._connId);
    console.log(ids);
    app.locals.connections.forEach(c => {
        c.send(JSON.stringify({ type: 'ids', ids }));
        // console.log(JSON.stringify({type: 'ids'}))
    });
}



wss.on('connection', (ws) => {
    
    ws._connId = `conn-${uuid.v4()}`;

    // send the local id for the connection
    ws.send(JSON.stringify({ type: 'connection', id: ws._connId }));
    ws.send(JSON.stringify(data));
    app.locals.connections.push(ws);
    console.log(ws);
    // send the list of connection ids
    broadcastConnections();

    ws.on('close', () => {
        let index = app.locals.connections.indexOf(ws);
        app.locals.connections.splice(index, 1);

        // send the list of connection ids
        broadcastConnections();
    });

    ws.on('message', (message) => {
        message = JSON.parse(message);
        data.type=message.type;
        data.enable=message.enable;
        data.value=message.value;

        for (let i = 0; i < app.locals.connections.length; i++) {
            if (app.locals.connections[i] !== ws) {
                app.locals.connections[i].send(JSON.stringify(message));
            }
        }
    });

});

app.get('/getToken', (req, res) => {
    let token = jwt.sign({iss : "3074457353059286897"},"ZEBTVlpZvFXx9pIndaDkJMuAndN9yeWl");
    console.log(token);
    res.setHeader('Content-Type', 'application/json');
    res.send({'token' : token});
});

server.listen(process.env.PORT || 8081, () => {
    console.log(`Started server on port ${server.address().port}`);
});