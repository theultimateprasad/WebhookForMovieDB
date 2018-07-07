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
    var color = req.body.result && req.body.result.parameters && req.body.result.parameters.color ? req.body.result.parameters.color : '';
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
    else if (sensor =='Humidity' | sensor =='soil moisture level') {
         ResultReply = 'percent';
    }
    else {

    }


    //************* Device Selector
    if (device =='light'){
        virtualVar = 'V14';
    }
    else if (device =='water pump'){
        virtualVar = 'V15';
    }
    else if (device =='mood lamp'){
        virtualVar = 'V11';
    }

    
    /*else if (device =='led' && !percentage == ''){
        virtualVar = 'V4';
    } */
    else if (sensor =='Temperature' ){
        virtualVar = 'V10';
    }
    else if (sensor =='Humidity' ){
        virtualVar = 'V12';
    }
    else if (sensor =='locker 1' ){
        virtualVar = 'V1';
    }
    else if (sensor =='locker 2'){
        virtualVar = 'V2';
    }
    else if (sensor =='soil moisture level'){
        virtualVar = 'V0';
    }
    else if (sensor =='car parking'){
        virtualVar = 'V7';
    }
    
    //State of the Device Selector 
    if (state =='on'){
        stateOfDevice = '1';
    }
    else if (state =='off'){
        stateOfDevice = '0';
    }

    if(color == 'red'){
        stateOfDevice = '1023&value=0&value=0';
    }
    else if(color == 'green'){
        stateOfDevice = '0&value=1023&value=0';
    }
    else if(color == 'blue'){
        stateOfDevice = '0&value=0&value=1023';
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
   const sensorUrl = encodeURI(`http://188.166.206.43/04ee22318acd49c3a067ed9b866d735e/get/${virtualVar}`);
   const controlUrl = encodeURI(`http://188.166.206.43/04ee22318acd49c3a067ed9b866d735e/update/${virtualVar}?value=${stateOfDevice}`);
   
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
           if(reqUrl == controlUrl && device != 'mood lamp' ){
            dataToSend += getWish()+`${device} is turned ${state} at garden. Thank you!`;  
           }
           else if(reqUrl == controlUrl && device == 'mood lamp' ){
               var complement ='';
               if(color == 'red'){complement ='looks like you have very romantic mood today !'; }
               else if(color == 'green'){complement ='Enjoy the color of peace!'; }
               else if(color == 'blue'){complement ='Enjoy the vibrant environment created only for you dear !'; }
            dataToSend += getWish()+`hey your ${device} is turned to ${color} color, ${complement}`;  
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
            if(sensor == 'Temperature' | sensor == 'Humidity'|sensor == 'soil moisture level'){
                dataToSend += getWish()+`${sensor} at garden is ${sensValue} ${ResultReply}. Thank You`;
            }
            else if (sensor == 'locker 1' | sensor == 'locker 2'){ 
                var lockstat = "";
                if(sensValue == '0'){lockstat ="closed";}
                else if (sensValue == '1'){lockstat ="opened";}

                dataToSend += getWish()+`${sensor} is in ${lockstat} condition. Thank You`;
            }
            else if (sensor == 'car parking'){ 
                var lockstat = "";
                if(sensValue == '0'){
                    dataToSend += getWish()+`${sensor} is in occupied condition. Please wait for some time or try to find some other location for parking. Thank You`;}
                else if (sensValue == '1'){
                    dataToSend += getWish()+`${sensor} is in vacant condition. you can park the car at our parking. Thank You`;}}

               
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

function getWish(){
    var myDate = new Date();
    var hours = myDate.getUTCHours()-8;
    if(hours<0){
        hours = hours + 24;
    }
    if(hours <12){
        return "Good Morning,";
    }else if (hours<18){
        return "Good afternoon,";
    }else {
        return "Good evening,";
    }

}



server.listen((process.env.PORT || 8000), () => {
   console.log("Server is up and running...");
});

