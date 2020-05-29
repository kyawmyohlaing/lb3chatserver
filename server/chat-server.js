const WebSocket = require('ws');
var models = require('./server.js').models;

const ws = new WebSocket.Server({port: 8080});
const clients = [];

ws.on('connection', (ws) => {
  function login(email, pass){
  console.log("EM", email, pass); 
    models.User.login({email: email, password: pass}, (err, result) => {
      if(err){
        ws.send(JSON.stringify({
          type: 'ERROR',
          error: err
        }));
      }else{
              models.User.findOne({
                where: {id: result.userId}, include: 'Profile'}, (err2, user) => {
                  if(err2){
                    ws.send(JSON.stringify({
                      type: 'ERROR',
                      error: err2
            }));
          }else{

            const userObject = {
              id: user.id,
              email: user.email,
              ws: ws,
            };

            clients.push(userObject);
            console.log("Current Client", clients);

            ws.send(JSON.stringify({
              type: 'LOGGEDIN',
              data: {
                session: result,
                user: user
              }
            }));
          }
        })
      }
    })
  }

  ws.on('message', (message) => {
    console.log('Got message', JSON.parse(message));
    let parsed = JSON.parse(message);
    if(parsed){
      switch(parsed.type){
        case 'SIGNUP':
          models.User.create(parsed.data, (err, user) => {
            if(err) {
              ws.send(JSON>stringify({
                type: 'ERROR',
                error: err
              }))
            }else {
              models.Profile.created({
                userId: user.id,
                name: parsed.data.name,
                email: parsed.data.email
              }, (profileError, profile) => {

              });
            }
            
          });
          break;
          case 'LOGIN':
            login(parsed.data.email, parsed.data.password);
            break;
          case 'SEARCH' :
            console.log("Searching for", parsed.data);  
            models.User.find({where: {email: {
              like: parsed.data
            }}}, (err2, users) => {
              if(!err2 && users){
                ws.send(JSON.stringify({
                  type: 'GOT_USERS',
                  data: {
                    users: users
                  },
                }));
              }
            });
            break;
            case 'FIND_THREAD':
            models.Thread.findOne({
              where: {
                and: [
                  {users: {like: parsed.data[0]}},
                  {users: {like: parsed.data[1]}},
                ],
              }}, (err, thread) => {
                if (!err && thread) {
                  ws.send(JSON.stringify({
                    type: 'ADD_THREAD',
                    data: thread,
                  }));
                }else{
                  models.Thread.create({
                    lastUpdated: new Date(),
                    users: parsed.data
                  },(err2, thread) => {
                    if (!err2 && thread) {
                      console.log("Client filter", clients.filter(u => thread.users.indexOf(u.id.toString()) > -1));
                      clients.filter(u => thread.users.indexOf(u.id) > -1).map(client => {
                        console.log("Client", client);
                        client.ws.send(JSON.stringify({
                          type: 'ADD_THREAD',
                          data: thread,
                        }));
                      });
                      
                    }
                  });
                }
              });
            break;

            default:
              console.log("Nothing to see here.");
      }
    }
  });
})
