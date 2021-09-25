import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'

//app config
const app = express()
const port = process.env.PORT || 9000


const pusher = new Pusher({
    appId: "1271859",
    key: "9aa3469af18c30b9f7c1",
    secret: "0a9dea231595302aea79",
    cluster: "eu",
    useTLS: true
  });

//middleware
app.use(express.json());
app.use(cors());

// app.use((req,res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });

//DB Config
const connection_url= 'mongodb+srv://admin:M8ZWVcpuCM0LY28k@cluster0.oowut.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(process.env.MONGOOSE_URL || connection_url,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection

db.once('open',() => {
    console.log("DB connected");

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log("A change occured",change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
             {
                 name: messageDetails.name,
                 message: messageDetails.message,
                 timestamp: messageDetails.timestamp,
                 received: messageDetails.received,
             });
         }else {
             console.log('Error triggering Pusher')
         }
    });
});

//api routes
app.get('/',(req,res)=>res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).json(data)
        }
    })
})

app.post('/messages/new', (req,res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err);
        }else {
            res.status(201).send(data);
        }
    });
})

// if (process.env.NODE_ENV === 'production'){
//     app.use(express.static('whatsapp-clone/build'));
// }

app.listen(port,()=>{
    console.log(`Listening on localhost:${port}`)
})