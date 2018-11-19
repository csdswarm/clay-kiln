//TODO: This should be in webpack, but because webpack is hard and confusing and we dont have time for it
const fs = require('fs');
const configFilePath = '../app/sites/demo/config.yml';
const configFile = fs.readFileSync(configFilePath, 'utf8');
const configFileArray = configFile.split('\n');

fs.readdir('../app/public/dist/js', (err, files) => {
    files.forEach(file => {
        //Make sure its a javascript file
        if(file.substr(file.lastIndexOf('.') + 1) == 'js') {
            //ket is first part of filename
            let key = file.split('.')[0];
            //If there is no key, add it
            if(configFile.indexOf(key+':') == -1) {
                console.log('added')
                configFileArray.push(key+": '"+file+"'\n");
            } else {
                //Loop through and replace
                for(let configItem in configFileArray){
                    if(configFileArray[configItem].indexOf(key+':')== 0){
                        configFileArray[configItem] = key+": '"+file+"'";
                        console.log('replaced')
                    }  
                }
            }
            
        } 
    });
    //convert array back to yml
    fs.writeFileSync(configFilePath, configFileArray.join('\n'));
});
