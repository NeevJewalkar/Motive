const express = require('express')
const fetch = require('node-fetch')
const bodyParser = require('body-parser')
const delay = require('delay')

let app = express()
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname));

let signedIn = false
let userHome = {}

let base = '13.233.138.124'

app.get('/', (req, res) => {
    if (signedIn) {
        res.render('home', { Motives: userHome.motives, Name: userHome.username})
    } else {
        res.render('main')
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
    } else {
        res.redirect('/login')
    }
})

app.get('/motive/:id', (req, res) => {
    if (signedIn) {
        fetch('http://' + base + ':3000/motives/id/get', { method: 'post', headers: { ID: req.params.id, Username: userHome.username } })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            res.render('motive', { motive: data.Motive, creater: data.creater, pledged: data.pledged, id: req.params.id })
        })
    } else {
        res.redirect('/login')
    }
})

app.get('/motive/:id/pledge', (req, res) => {
    if (signedIn) {
        fetch('http://' + base + ':3000/motives/id/get', { method: 'post', headers: { ID: req.params.id, Username: userHome.username } })
        .then(res => res.json())
        .then(data => {
            res.render('pledge', { id: req.params.id, username: userHome.username, Title: data.Motive.Title })
        })
    } else {
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    signedIn = false
    userHome = {}
    res.redirect('/')
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
                res.redirect('/')
            })
        }
    })
})

app.post('/create', (req, res) => {
    console.log(userHome)
    fetch('http://' + base + ':3000/motives/create', { method: 'post', headers: { Username: userHome.username, Email: userHome.email, Title: req.body.Title, Description: req.body.Description , Deadline: req.body.Deadline , Amount: req.body.Amount  } })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        refreshUserData((temp) => {
            console.log(userHome)
            userHome = temp
            res.redirect('/')
        })
    })
})

app.post('/pledge/:id', (req, res) => {
    fetch('http://' + base + ':3000/motives/contacts/add', { method: 'post', headers: { Username: userHome.username, Email: userHome.email, ID: req.params.id, Amount: req.body.Amount } })
    .then(res => res.json())
    .then(data => {
        res.redirect('/motive/' + req.params.id)
    })
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