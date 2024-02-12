import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {config} from 'dotenv';
import morgan from 'morgan';

import userRoutes from '../Server2/routes/user.routes.js'
import courseRoutes from '../Server2/routes/course.routes.js'
import paymentRoutes from './routes/payment.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';

const app = express();


config(); // considers all values in env file

app.use(express.json()); // used for parsing


app.use(express.urlencoded({extended:true})); // used to take querries, params from the url easily


app.use(cookieParser()); // when token is setup , we can parse it

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // Cookie can move easily

}))


app.use('/ping',function(req,res){ // to check whether our server is up or not with bare configurations
    res.send('/pong')
})


app.use(morgan('dev'))


app.use('/api/v1/user',userRoutes);
app.use('/api/v1/courses',courseRoutes);
app.use('/api/v1/payments',paymentRoutes);



// routes of 3 module

app.all('*',(req,res)=>{ // random url
    res.status(404).send('OOPS!! 404 page not found')
})


app.use(errorMiddleware);

export default app;
