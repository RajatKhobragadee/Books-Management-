const express = require('express');
const bodyParser = require('body-parser');
const route = require('./src/routes/route');
const  mongoose = require('mongoose');
const app = express();
const multer= require("multer");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const { AppConfig } = require('aws-sdk');
app.use( multer().any())

mongoose.connect("mongodb+srv://avenger:rajatrajat12@cluster0.wuyw0.mongodb.net/53Database?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch (err => console.log(err) )

app.use('/', route);

app.listen( process.env.PORT || 3000, function () {
    console.log('Express app running on port ' +( process.env.PORT || 3000))
});


