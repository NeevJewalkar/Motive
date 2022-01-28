const express = require('express')
const fetch = require('node-fetch')
const bodyParser = require('body-parser')
const delay = require('delay')
const { Server } = require('socket.io')
const querystring = require('querystring');

const io = new Server(3003, { 
    cors: {
    origin: "*",
    methods: ["GET", "POST"]
  } 
})

let app = express()
app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname));

let signedIn = null
let userHome = {}
let tempuser = ''
let tempemail = ''

let client = 'localhost'
let base = 'localhost'

/*
let query = querystring.stringify({
            "redirect": "/motive/" + req.params.id
        });
res.redirect('/wait/?' + query);
*/

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
        let query = querystring.stringify({
            "redirect": "/"
        });
        res.redirect('/wait/?' + query);
    } else {
        console.log('SignedIn Variable is Blank, assigining it a value...')
        let query = querystring.stringify({
            "redirect": "/"
        });
        res.redirect('/wait/?' + query);
    }
}) 

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/login', (req, res) => {
    res.render('login', { message: ' ' })
})

app.get('/create', (req, res) => {
    if (signedIn) {
        res.render('create')
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        let query = querystring.stringify({
            "redirect": "/create"
        });
        res.redirect('/wait/?' + query);
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
            let query = querystring.stringify({
                "redirect": "/motive/" + req.params.id
            });
            res.redirect('/wait/?' + query);
        }
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        let query = querystring.stringify({
            "redirect": "/motive/" + req.params.id
        });
        res.redirect('/wait/?' + query);
    }
})

app.get('/wait', (req, res) => {
    console.log(req.query.redirect, '≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤≤e')
    io.on('connection', socket => {
        console.log('connected to client')
        socket.on('user', data => {
            if (data.val == 'true') {
                console.log(data)
                signedIn = true
                tempuser = data.username
                console.log(req.get('redirect'))
                refreshUserData(data => {
                    userHome = data
                    io.to(socket.id).emit('done', { url: req.query.redirect })
                console.log(req.query.redirect)
                })
            } else {
                signedIn = false
                console.log(signedIn, 'val')
                io.to(socket.id).emit('done', { url: req.query.redirect })
                console.log(req.query.redirect)
            }
        })
    })
    res.contentType('html').send(`<script src="http://${client}:3003/socket.io/socket.io.js"></script>
    <script>

    let socket = io('http://${client}:3003')
    socket.emit('user', { val: localStorage.getItem("loggedin"), username: localStorage.getItem("user") })
    socket.on('done', data => {
        location.href = new URLSearchParams(window.location.search).get('redirect')
    })
    
    </script>`)

    

})


app.get('/login/wait', (req, res) => {
    res.contentType('html').send(`<script>localStorage.setItem('user', '${tempuser}');localStorage.setItem('loggedin', 'true');localStorage.setItem('email', '${tempemail}');location.href='/'</script>`)
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
            
        }
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        let query = querystring.stringify({
            "redirect": "/motive/" + req.params.id + "/pledge"
        });
        res.redirect('/wait/?' + query);
    }
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
            let query = querystring.stringify({
                "redirect": "/motive/" + req.params.id + "/unpledge"
            });
            res.redirect('/wait/?' + query);
        }
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        let query = querystring.stringify({
            "redirect": "/motive/" + req.params.id + "/unpledge"
        });
        res.redirect('/wait/?' + query);
    }
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
            let query = querystring.stringify({
                "redirect": "/motive/" + req.params.id + "/finish"
            });
            res.redirect('/wait/?' + query);
        }
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        let query = querystring.stringify({
            "redirect": "/motive/" + req.params.id + "/finish"
        });
        res.redirect('/wait/?' + query);
    }
})

app.get('/logout', (req, res) => {
    res.contentType('html').send(`<script>localStorage.setItem('loggedin', 'false');window.location.href = "/";</script>`)
    signedIn = false
})

app.get('/login/wait', (req, res) => {
    res.contentType('html').send(`<script>localStorage.setItem('user', '${tempuser}');localStorage.setItem('loggedin', 'true');localStorage.setItem('email', '${tempemail}');location.href='/'</script>`)
})

app.get('/motive/:id/updates', (req, res) => {
    if (signedIn) {
        console.log(tempuser, 'ugweiurgwerygweurg')
        if (tempuser != null) {
        fetch('http://' + base + ':3000/motives/updates/get', { method: 'post', headers: { ID: req.params.id, Username: tempuser } })
        .then(res => res.json())
        .then(data => {
            res.render('updates', { data: data.Updates, creater: data.creater, id: req.params.id })
            console.log(data)
            tempuser = null
            signedIn = null
        })
        } else {
            let query = querystring.stringify({
                "redirect": "/motive/" + req.params.id + "/updates"
            });
            res.redirect('/wait/?' + query);
        }

    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        let query = querystring.stringify({
            "redirect": "/motive/" + req.params.id + "/updates"
        });
        res.redirect('/wait/?' + query);
    }
})


app.get('/motive/:id/updates/create', (req, res) => {
    if (signedIn) {
        res.render('uCreate', { id: req.params.id })
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        let query = querystring.stringify({
            "redirect": "/motive/" + req.params.id + "/updates/create"
        });
        res.redirect('/wait/?' + query);
    }
})

app.get('/motive/:mId/update/:id', (req, res) => {
    if (signedIn) {
        fetch('http://' + base + ':3000/motives/update/get', { method: 'post', headers: { ID: req.params.mId, uID: req.params.id, Username: tempuser } })
        .then(resu => resu.json())
        .then(data => {
            console.log(data.Update)
            res.render('update', { content: data.Update.text, date: data.Update.timestamp, comments: data.Update.Comments, id: req.params.mId, uid: req.params.id })
            console.log('got1')

            io.on('connection', socket => {
                console.log('connected to socket')
                console.log('connected to client')
                socket.on('comment', data => {
                    console.log('got2')
                    comment(req.params.mId, req.params.id, data.user, data.text, () => {
                        console.log('got3')
                        io.to(socket.id).emit('done')
                    })
                })
            })
        })
    } else if (signedIn == false) {
        res.redirect('/login')
    } else {
        
        let query = querystring.stringify({
            "redirect": "/motive/" + req.params.mId + "/update/" + req.params.id
        });
        res.redirect('/wait/?' + query);
    }

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
                res.redirect('/login/wait')
            })
        }
    })
})

app.post('/create', (req, res) => {
    console.log('creating motive')
    tempuser = req.body.username
    tempemail = req.body.email
    console.log(req.body.username, '=======================')
    if (tempuser != null) {
        console.log('tempuser and tempemail are not null')
        console.log(userHome)
        fetch('http://' + base + ':3000/motives/create', { method: 'post', headers: { Username: tempuser, Email: tempemail, Title: req.body.Title, Description: req.body.Description , Deadline: req.body.Deadline , Amount: req.body.Amount  } })
        .then(res => res.json())
        .then(data => {
            console.log(data, '≤–––––––––––––––––––––')
            refreshUserData((temp) => {
                console.log(userHome)
                userHome = temp
                signedIn = null
                res.redirect('/')
                tempuser = null
                tempemail = null

            })
        })
    } else {
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~')
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

app.post('/updates/:id/create', (req, res) => {
    tempuser = req.body.username
    tempemail = req.body.email
    if (tempuser != null) {
        fetch('http://' + base + ':3000/motives/updates/add', { method: 'post', headers: { ID: req.params.id, Update: '{ "timestamp": ' + Date.now() + ', "text": "' + req.body.text + '" }' } })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            refreshUserData((temp) => {
                console.log(userHome)
                userHome = temp
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

let comment = (id, uid, user, text, cb) => {
    console.log(user, text)
    fetch('http://' + base + ':3000/motives/update/comment/add', { method: 'post', headers: { ID: id, user: user, content: text, uID: uid } })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        cb('added comment')
    })
}

const getUserData = (user, cb) => {

    fetch('http://' + base + ':3000/user/get', { method: 'post', headers: { Username: user } })
    .then(res => res.json())
    .then(data => {
        cb({ name: user, email: data.Email })
    })

}