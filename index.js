'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const server = express();

server.use(bodyParser.urlencoded({
    extended: true
}));

server.use(bodyParser.json());

server.post('/get-sensor-values', (req, res) => {

    // Device Control 
    var device = req.body.result && req.body.result.parameters && req.body.result.parameters.Device ? req.body.result.parameters.Device :''; // ? req.body.queryResult.parameters.Device : 'ceiling fan';
    var state =  req.body.result && req.body.result.parameters && req.body.result.parameters.state ? req.body.result.parameters.state : '';
    var location =  req.body.result && req.body.result.parameters && req.body.result.parameters.location ? req.body.result.parameters.location : '';
    //var percentage = req.body.result && req.body.result.parameters && req.body.result.parameters.number ? req.body.result.parameters.number : '';
    

    //********** Get the Sensor Value */
    var sensor = req.body.result && req.body.result.parameters && req.body.result.parameters.Sensor? req.body.result.parameters.Sensor : '';// ? req.body.queryResult.parameters.Sensor : 'Temperature';
    
    var virtualVar ='';
    var stateOfDevice ='';
    var ResultReply ='';
    var sensValue ='';
    let newstate = '';
    var reqUrl ='';
   
    //************Sensor Reply for Temperature or Humidity */
    if (sensor=='Temperature'){
         ResultReply = 'degree Celcious';
    }
    else{
         ResultReply = 'percentage';
    }


    //************* Device Selector
    if (device =='ceiling fan' && location == 'Jain University'){
        virtualVar = 'V2';
    }
    else if (device =='ceiling fan' && location == 'Nagpur University'){
        virtualVar = 'V5';
    }
    if (device =='ceiling fan' && location == 'Poornima University'){
        virtualVar = 'V8';
    }
    else if (device =='light' && location == 'Jain University'){
        virtualVar = 'V1';
    }
    else if (device =='light' && location == 'Nagpur University'){
        virtualVar = 'V4';
    }
    else if (device =='light' && location == 'Poornima University'){
        virtualVar = 'V7';
    }
    /*else if (device =='led' && !percentage == ''){
        virtualVar = 'V4';
    } */
    else if (sensor =='Temperature' && location == 'Jain University'){
        virtualVar = 'V3';
    }
    else if (sensor =='Temperature' && location == 'Nagpur University'){
        virtualVar = 'V6';
    }
    else if (sensor =='Temperature' && location == 'Poornima University'){
        virtualVar = 'V9';
    }

    else if (sensor =='Humidity' && location == 'Jain University'){
        virtualVar = 'V11';
    }
    else if (sensor =='Humidity' && location == 'Nagpur University'){
        virtualVar = 'V12';
    }
    else if (sensor =='Humidity' && location == 'Poornima University'){
        virtualVar = 'V10';
    }

    //State of the Device Selector 
    if (state =='on'){
        stateOfDevice = '1';
    }
    else if (state =='off'){
        stateOfDevice = '0';
    }

    //************New state of device for difference in digital & Analog Control */
/*
    if (stateOfDevice !=''){
        newstate = stateOfDevice;
    }
    else{
        newstate = percentage; 
    }
    */
   // ******* URL to GET The Data from the Ubidots ******************
   //const reqUrl = encodeURI(`http://50.23.124.68/api/v1.6/devices/Demo/${sensor}/values?token=A1E-oxPfX1l1rtkLc29tPMW6UoqpwzoTVI`);
   //**************** URL to get & send the Data from Blynk */
   const sensorUrl = encodeURI(`http://188.166.206.43/c83cd1d24f1b4a5a9365d4b8d79468aa/get/${virtualVar}`);
   const controlUrl = encodeURI(`http://188.166.206.43/c83cd1d24f1b4a5a9365d4b8d79468aa/update/${virtualVar}?value=${stateOfDevice}`);
   
   //****************Selection of URL for control & Monitor */
   if(sensor !=''){
       reqUrl = sensorUrl;
   }
   else{
    reqUrl = controlUrl;
   }
   console.log('Required URL = '+ reqUrl);
   
   http.get(reqUrl, (responseFromAPI) => {
       let completeResponse = '';
       responseFromAPI.on('data', (chunk) => {
           completeResponse += chunk;
           //console.log(completeResponse);
       });
       responseFromAPI.on('end', () => {
                
           

           
           let dataToSend = '';
           if(reqUrl == controlUrl){
            dataToSend += `${device} is turned ${state} at ${location}. Thank You`;  
           }
           /*
           else if(reqUrl == controlUrl && newstate == percentage){
            dataToSend += `Intensity of ${device} is turned to ${newstate} %. Thank You`;  
           } */
           else if(reqUrl == sensorUrl){
            //*********Parsing for the Ubidots */
            //console.log('Sensor Value is = '+JSON.stringify(sensValue.queryResults[0].value));

            //***********Data Parsing for the Blynk */
            sensValue = JSON.parse(completeResponse);
            dataToSend += `${sensor} at location ${location} is ${sensValue} ${ResultReply}. Thank You`;  
           }
           

           return res.json({
               speech: dataToSend,
               displayText: dataToSend,
               source: 'get-sensor-values'
           });
       });
   }, (error) => {
       return res.json({
           speech: 'Something went wrong!',
           displayText: 'Something went wrong!',
           source: 'get-sensor-values'
       });
   });
});


server.listen((process.env.PORT || 8000), () => {
   console.log("Server is up and running...");
});

