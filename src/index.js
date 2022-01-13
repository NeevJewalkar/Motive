const express = require('express')
const fetch = require('node-fetch')
const bodyParser = require('body-parser')
const delay = require('delay')
const { Server } = require('socket.io')

const io = new Server(3003, { 
    cors: {
    origin: "*",
    methods: ["GET", "POST"]
  } 
})

let app = express()
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname));

let signedIn = null
let userHome = {}
let tempuser = ''
let tempemail = ''

let base = 'localhost'

app.get('/', (req, res) => {
    console.log(signedIn, 'val')
    if (signedIn) {
        fetch('http://' + base + ':3000/motives/get', { method: 'post', headers: { Username: tempuser } })
        .then(resu => resu.json())
        .then(data => {
            console.log(tempuser)
            userHome.motives = data
            userHome.username = tempuser
            tempuser = ''
            res.render('home', { Motives: userHome.motives, Name: userHome.username})
            signedIn = null
            tempemail = ''
        })
    } else if (signedIn == false) {
        res.render('main')
        signedIn = null
        console.log(signedIn, 'val')
    } else {
        console.log('SignedIn Variable is Blank, assigining it a value...')
        res.redirect('/home/wait')
    }
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/home/wait', (req, res) => {
    res.contentType('html').send(`<script src="http://192.168.29.68:3003/socket.io/socket.io.js"></script><script>
    let socket = io('http://192.168.29.68:3003')
     socket.emit('logged', { val: localStorage.getItem("loggedin"), username: localStorage.getItem("user") })   
     socket.on('done', data => {
         location.href = '/'
     })
     </script>`)

     io.on('connection', socket => {
         console.log('connected to client')
         socket.on('logged', data => {
             console.log('data')
            if (data.val == 'true') {
                signedIn = true
                console.log(signedIn, 'val')
                console.log(data.username)
                tempuser = data.username
                refreshUserData(data => {
                    userHome = data
                    io.to(socket.id).emit('done')
                })
            } else {
                signedIn = false
                console.log(signedIn, 'val')

                io.to(socket.id).emit('done')
            }
         })
     })

})

app.get('/login', (req, res) => {
    res.render('login', { message: ' ' })
})

app.get('/create', (req, res) => {
    if (signedIn) {
        res.render('create')
    } else {
        res.redirect('/login')
    }
})

app.get('/motive/:id', (req, res) => {
    if (signedIn) {
        if (tempuser != null) {
            fetch('http://' + base + ':3000/motives/id/get', { method: 'post', headers: { ID: req.params.id, Username: tempuser } })
            .then(res => res.json())
            .then(data => {
                console.log(data)
                res.render('motive', { motive: data.Motive, creater: data.creater, pledged: data.pledged, id: req.params.id, Contacts: data.Contacts, finished: data.Finished })
                tempuser = null
            })
        } else {
            res.redirect('/motive/' + req.params.id + '/wait')
        }
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        res.redirect('/motive/' + req.params.id + '/wait')
    }
})

app.get('/motive/:id/wait', (req, res) => {
    res.contentType('html').send(`<script src="http://192.168.29.68:3003/socket.io/socket.io.js"></script>
    <script>

    let socket = io('http://192.168.29.68:3003')
    socket.emit('user', { val: localStorage.getItem("loggedin"), username: localStorage.getItem("user") })
    socket.on('done', data => {
        location.href = '/motive/${req.params.id}'
    })
    
    </script>`)

    io.on('connection', socket => {
        console.log('connected to client')
        socket.on('user', data => {
            if (data.val == 'true') {
                console.log(data)
                signedIn = true
                tempuser = data.username
                refreshUserData(data => {
                    userHome = data
                    io.to(socket.id).emit('done')
                })
            } else {
                signedIn = false
                console.log(signedIn, 'val')
                io.to(socket.id).emit('done')
            }
        })
    })

})

app.get('/motive/:id/pledge', (req, res) => {
    if (signedIn) {
        if (tempuser != null) {
            fetch('http://' + base + ':3000/motives/id/get', { method: 'post', headers: { ID: req.params.id, Username: tempuser } })
            .then(res => res.json())
            .then(data => {
                res.render('pledge', { id: req.params.id, username: tempuser, Title: data.Motive.Title })
                tempuser = null
            })
        } else {
            res.redirect('/motive/' + req.params.id + '/pledge/wait')
        }
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        res.redirect('/motive/' + req.params.id + '/pledge/wait')
    }
})

app.get('/motive/:id/pledge/wait', (req, res) => {
    res.contentType('html').send(`<script src="http://192.168.29.68:3003/socket.io/socket.io.js"></script>
    <script>

    let socket = io('http://192.168.29.68:3003')
    socket.emit('user', { val: localStorage.getItem("loggedin"), username: localStorage.getItem("user") })
    socket.on('done', data => {
        location.href = '/motive/${req.params.id}/pledge'
    })
    
    </script>`)

    io.on('connection', socket => {
        console.log('connected to client')
        socket.on('user', data => {
            if (data.val == 'true') {
                console.log(data)
                signedIn = true
                tempuser = data.username
                refreshUserData(data => {
                    userHome = data
                    io.to(socket.id).emit('done')
                })
            } else {
                signedIn = false
                console.log(signedIn, 'val')
                io.to(socket.id).emit('done')
            }
        })
    })
})

app.get('/motive/:id/unpledge', (req, res) => {
    if (signedIn) {
        if (tempuser != null) {
            fetch('http://' + base + ':3000/motives/contacts/remove', { method: 'post', headers: { ID: req.params.id, Name: tempuser } })
            .then(res => res.json())
            .then(data => {
                console.log(data)
                res.redirect('/motive/' + req.params.id)
                tempuser = null
                signedIn = null
            })
        } else {
            res.redirect('/motive/' + req.params.id + '/unpledge/wait')
        }
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        res.redirect('/motive/' + req.params.id + '/unpledge/wait')
    }
})

app.get('/motive/:id/unpledge/wait', (req, res) => {
    res.contentType('html').send(`<script src="http://192.168.29.68:3003/socket.io/socket.io.js"></script>
    <script>

    let socket = io('http://192.168.29.68:3003')
    socket.emit('user', { val: localStorage.getItem("loggedin"), username: localStorage.getItem("user") })
    socket.on('done', data => {
        location.href = '/motive/${req.params.id}/unpledge'
    })
    
    </script>`)

    io.on('connection', socket => {
        console.log('connected to client')
        socket.on('user', data => {
            if (data.val == 'true') {
                console.log(data)
                signedIn = true
                tempuser = data.username
                refreshUserData(data => {
                    userHome = data
                    io.to(socket.id).emit('done')
                })
            } else {
                signedIn = false
                console.log(signedIn, 'val')
                io.to(socket.id).emit('done')
            }
        })
    })
})

app.get('/motive/:id/finish', (req, res) => {
    if (signedIn) {
        if (tempuser != null) {
            fetch('http://' + base + ':3000/motives/finish', { method: 'post', headers: { ID: req.params.id, Username: userHome.username, value: 'true' } })
            .then(res => res.json())
            .then(data => {
                res.redirect('/motive/' + req.params.id)
                tempuser = null
                signedIn = null
            })
        } else {
            res.redirect('/motive/' + req.params.id + '/finish/wait')
        }
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        res.redirect('/motive/' + req.params.id + '/finish/wait')
    }
})

app.get('/motive/:id/finish/wait', (req, res) => {
    res.contentType('html').send(`<script src="http://192.168.29.68:3003/socket.io/socket.io.js"></script>
    <script>

    let socket = io('http://192.168.29.68:3003')
    socket.emit('user', { val: localStorage.getItem("loggedin"), username: localStorage.getItem("user") })
    socket.on('done', data => {
        location.href = '/motive/${req.params.id}/finish'
    })
    
    </script>`)

    io.on('connection', socket => {
        console.log('connected to client')
        socket.on('user', data => {
            if (data.val == 'true') {
                console.log(data)
                signedIn = true
                tempuser = data.username
                refreshUserData(data => {
                    userHome = data
                    io.to(socket.id).emit('done')
                })
            } else {
                signedIn = false
                console.log(signedIn, 'val')
                io.to(socket.id).emit('done')
            }
        })
    })
})

app.get('/logout', (req, res) => {
    res.contentType('html').send(`<script>localStorage.setItem('loggedin', 'false');window.location.href = "/";</script>`)
    signedIn = false
})

app.get('/wait', (req, res) => {
    res.contentType('html').send(`<script>localStorage.setItem('user', '${tempuser}');localStorage.setItem('loggedin', 'true');localStorage.setItem('email', '${tempemail}');location.href='/'</script>`)
})

app.post('/signup', (req, res) => {
    fetch('http://' + base + ':3000/user/create', { method: 'post', headers: { "Username": req.body.username, "Password": req.body.password, "Email": req.body.email } })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        res.render('login', { message: 'Now you can Login to your account' })
    })
})

app.post('/login', (req, res) => {
    fetch('http://' + base + ':3000/user/get', { method: 'post', headers: { Username: req.body.username, Password: req.body.password } })
    .then(res => res.json())
    .then(data => {
        console.log(data.Message)
        if (data.Message == 'User or Password is Invalid') {
            res.render('login', { message: 'Invalid username or password' })
        } else {
            let mail = data.Email
            fetch('http://' + base + ':3000/motives/get', { method: 'post', headers: { Username: req.body.username } })
            .then(res => res.json())
            .then(data => {
                console.log(data)
                
                userHome = {
                    username: req.body.username,
                    motives: data,
                    email: mail
                }
                signedIn = true
                tempuser = req.body.username
                tempemail = mail
                res.redirect('/wait')
            })
        }
    })
})

app.post('/create', (req, res) => {
    tempuser = req.body.username
    tempemail = req.body.email
    if (tempuser != null) {
        console.log(userHome)
        fetch('http://' + base + ':3000/motives/create', { method: 'post', headers: { Username: tempuser, Email: tempemail, Title: req.body.Title, Description: req.body.Description , Deadline: req.body.Deadline , Amount: req.body.Amount  } })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            refreshUserData((temp) => {
                console.log(userHome)
                userHome = temp
                res.redirect('/')
                tempuser = null
                tempemail = null

            })
        })
    }
})

app.post('/pledge/:id', (req, res) => {
    console.log(req.body.username, ' <–––––––––––––––––––')
    tempuser = req.body.username
    tempemail = req.body.email
    if (tempuser != null) {
        fetch('http://' + base + ':3000/user/get', { method: 'post', headers: { Username: tempuser } })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            fetch('http://' + base + ':3000/motives/contacts/add', { method: 'post', headers: { Name: tempuser, Email: tempemail, ID: req.params.id, Amount: req.body.Amount } })
            .then(res => res.json())
            .then(data => {
                res.redirect('/motive/' + req.params.id)
                tempuser = null
                tempemail = null
            })
        })
    }
})


app.listen(8028, () => {
    console.log('listening on port 8028')
})

const refreshUserData = (cb) => {
    fetch('http://' + base + ':3000/motives/get', { method: 'post', headers: { Username: userHome.username } })
    .then(res => res.json())
    .then(data => {
        console.log(data)

        let temp = {
            username: userHome.username,
            motives: data,
            email: userHome.email
        }

        cb(temp);
    })
}

const getUserData = (user, cb) => {

    fetch('http://' + base + ':3000/user/get', { method: 'post', headers: { Username: user } })
    .then(res => res.json())
    .then(data => {
        cb({ name: user, email: data.Email })
    })

}