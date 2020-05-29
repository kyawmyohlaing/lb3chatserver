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

              })
            }
            
          })
          case 'LOGIN':
            login(parsed.data.email, parsed.data.password);
            default:
              console.log("Nothing to see here.");
      }
    }
  });
})
