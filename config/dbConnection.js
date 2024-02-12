import mongoose from "mongoose";

mongoose.set('strictQuery',false); 


const connectionToDB = async()=>
{
   try{
    const {connection} = await mongoose.connect(process.env.MONG_URI || 'mongodb://localhost:27017/lms'
      );
      if(connection)
      {
          console.log(`Connected to MongDB : ${connection.host}`)
      }
   }
   catch(e)
   {
        console.log(e)
        process.exit(1);
   }

}

export default connectionToDB;