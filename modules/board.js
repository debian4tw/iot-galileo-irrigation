/*
MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

Article: https://software.intel.com/en-us/html5/articles/intel-xdk-iot-edition-nodejs-templates
*/
var sensorStates = require('../conf/sensorStates');
var actuatorStates = require('../conf/actuatorStates');
var config = require('../conf/config');

var mraa = false;
if(config.boardEnabled){
    mraa = require('mraa');
}


/**
  * Board description
  * @namespace
  */


var board = function(fnOnActionExecuted){
    
    var analogPin0;
    var currentSensorState = false;
    var currentActuatorState = false;
    var actuator;
    var actions = [];
    var leds = {};
    

    var onActionExecuted = fnOnActionExecuted;


    if(!mraa){        
        console.log('cannot initialize board, missing mraa');
        //return;
    }else{

        console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console    
        setupLeds();
    }

    /** init function */
    function init(){
        console.log('init');
        if(mraa){
            loop();    
        }
        
    }
    

    /** loop */
    function loop() {
      Medir_Humedad();
      setTimeout(loop,3000); //call the indicated function after 1 second (1000 milliseconds)
    }    

    /** Medir Humedad */    
    function Medir_Humedad() {
        //humedad1 = analogRead(A5);
        //Serial.println(humedad1);
        var humedad = analogPin0.read(); //read the value of the analog pin
        
        console.log(humedad); //write the value of the analog pin to the console        
                        
        //var humedad = 400;
        
        for (var x in sensorStates){
            if( isInStateRange(humedad, sensorStates[x]) ){
                prenderLed(x);
                doAction(sensorStates[x].triggersActuatorState, "auto");
            }
        }

    }
    
    /** doAction 
    * @param {actionType} triggerAction
    * @param {actionType} actionType
    */    
    function doAction(triggerAction, actionType){
        //console.log('doAction: ',currentActuatorState, triggerAction);
        if(currentActuatorState != triggerAction){            
                //console.log('actionType', actionType);
                //console.log('triggerAction ', triggerAction);
                //console.log('actuatorStates ',actuatorStates);
                //console.log(actuatorStates[triggerAction]);
            if(mraa){

                actuator.write(actuatorStates[triggerAction].signal);    
            }
            
            currentActuatorState = triggerAction;
            //saveAction(new Date().toLocaleString(), triggerAction, actionType);
            onActionExecuted(triggerAction, actionType);
        }

    }

    /** saveAction */    
    function saveAction(date, triggerAction, actionType){
         var action = { 
            action: triggerAction,
            date: date, 
            actionType: actionType 
        };
        actions.push(action);  
    }

    
    function isInStateRange(humedad, state){
        return (humedad > state.lowerLimit && humedad < state.upperLimit);
    }

  
    function setupLeds(){
        //var myOnboardLed = new mraa.Gpio(13); //LED hooked up to built in pin        
        //myOnboardLed.dir(mraa.DIR_OUT); 
        for(x in sensorStates){
            leds[x] = new mraa.Gpio(sensorStates[x].pin); //LED PIN
            leds[x].dir(mraa.DIR_OUT); //set the gpio direction to output
        }        

        actuator = new mraa.Gpio(4);
        actuator.dir(mraa.DIR_OUT);
        
        analogPin0 = new mraa.Aio(0); //setup access analog input Analog pin #0 (A0)
    }    
 
    function getActuatorState(){
        return currentActuatorState;
    }
    
    function prenderLed(state){
        if(!mraa){
            return;
        }
        if(currentSensorState != state){
            console.log('prendo led ' + sensorStates[state].pin + " " +sensorStates[state].color);

            leds[state].write(1);
            if(currentSensorState){
                apagarLed(currentSensorState);
            }
            currentSensorState = state;
        }

        //myOnboardLed.write(1);
    }

    function apagarLed(state){
        console.log('apago led');
        leds[state].write(0);
    }
  

        
    return {
        apagarLed : apagarLed,
        prenderLed: prenderLed,
        getActuatorState: getActuatorState,
        doAction: doAction,
        init: init,
        onActionExecuted: onActionExecuted
    }
    
};


module.exports = board;