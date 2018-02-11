const net = require('net')
const uuid = require('uuid/v1')
const bonjour = require('bonjour')()
const timestamp = require('unix-timestamp')
timestamp.round = true

const connection = {
    exclusive: true
}

var clients = []

function find(array, type, searchFor){
    var find = array.some(element => {
        //console.log(element)       
            if(element[type] == searchFor[type]) {
                console.log('found ' + type + ':', element.name, element.uuid)
                return element;
            }
        });

        if(find) {
            return find;
        } else {
            return false
        }
}


const server = new net.createServer((socket) => {
    socket.setEncoding()
    console.log('Client connected!')
    //socket.write('Hello World')
    //clients.push(socket)
    server.getConnections((err, count) => {
        console.log('Connections:', err, count)
    })

    socket.on('connect', () => {
        console.log('Connected')
        
    })

    socket.on('data', (data) => {
        const payload = JSON.parse(data)
        if(payload.type == 'connection') {
            if(payload.data.name) {
                console.log(payload.data)
                var isNameValid = !find(clients, 'name', payload.data)
                if(isNameValid) {
                    var client = {
                        uuid: uuid(),
                        name: payload.data.name,
                        socket: socket
                    }

                    clients.push(client)
                    console.log('add user:', client.name, client.uuid)
                    socket.write(JSON.stringify({type: 'uuid', data: {uuid: client.uuid}}))
                } else {
                    socket.write(JSON.stringify({type: 'error', data: { key: '-1', message: 'User already taken'}}))
                    console.log('User already token:', payload.data)
                }
            
            }
            
            //socket.write(data)
        } else if(payload.type == 'message') {
            const user = find(clients, 'uuid', payload.data)
            if(payload.data.content.length < 65935 && user) {
                console.log('Reveived message', payload.data.content)
                const userName = clients.find((obj) => {
                    return obj.uuid === payload.data.uuid
                })

                const message = {
                    type: 'message',
                    data: {
                        timestamp: timestamp.now(),
                        user_name: userName.name,
                        content: payload.data.content
                    }
                }
                

                boradcast(JSON.stringify(message))
            }
        }
        //boradcast(data, socket)
    })

    socket.on('end', () => {
        console.log('Socket end')
        var client = !find(clients, 'socket', socket)

    })

    socket.on('close', () => {
        console.log('socket closed')
    })
})
server.on('error', (e) => {
    if(e.code === 'ECONNRESET') {
        console.log(e)
    }
})
server.listen( () => {
    const address = server.address()
    bonjour.publish({ name: 'Code chat server', type: 'tcp', port: address.port, txt: {service: 'cpp'} })
    console.log('Server listening on:', address)
})

function boradcast(data) {
    clients.forEach(client => {
        var socket = client.socket
        //if (sender === socket) return
        socket.write(data)
        //console.log("Write to scoket")
    });
}
