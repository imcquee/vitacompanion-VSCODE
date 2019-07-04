const vscode = require('vscode');
const Netcat = require('node-netcat');
const Cache = require('vscode-cache');
const fs = require("fs");
const dir = require("path");
const FtpDeploy = require("ftp-deploy");
const PromiseFtp = require('promise-ftp');
const AdmZip = require('adm-zip');



var client = 0;
var TITLE_ID, TITLE;
var fpath = 0;
var ip_addr = 0;
var rRoot = 0;
var target = 0;

async function launch (target){
    var appList;
    var found = 0;
    var ftp = new PromiseFtp();
    ftp.connect({host: ip_addr, user: "anonymous", password: "@anonymous", port: 1337})
    .then(function (serverMessage) {
    return ftp.cwd("/ux0:/app/");
    }).then(function () {
    return ftp.list('/');
    }).then(async function (res){
        
        async function find(){
            for(i=0; i<res.length; i++){
                if(res[i].name == target) found = 1;
            }
        }
        await find();
        async function boot(){
            if(found){
                client.start();
                client.send('launch ' + target + '\n', true);
            }
            else vscode.window.showInformationMessage("This title is not installed on your device");
        }
        await boot();
    return ftp.end(); 
    });
}

function wake () {
    client.start();
    client.send('screen on\n', true);
}

function terminate(){
    client.start();
    client.send('destroy\n', true);
}

async function check_param() {
    if(fs.existsSync(fpath)) {
        async function val () {
            try {
                process.chdir(fpath);
            } catch (err) {
                await vscode.window.showInformationMessage("ERROR: Cannot access this directory");
                process.exit(1);
            }
        }
        await val();
        if(fs.existsSync('eboot.bin') && fs.existsSync('param.sfo')) {
            let fd = fs.openSync('param.sfo','r');
            var store1 = ["magic", "version", "keyTableOffset", "dataTableOffset" ,"indexTableEntries"];
            var store2 = ["keyOffset", "param_fmt", "paramLen", "paramMaxLen", "dataOffset"];
            var param = {};
            var entry_table = new Array();
            const rd1 = Buffer.alloc(4);  
            const rd2 = Buffer.alloc(2);
            function unpack1 () {
                for(i=0; i<5; i++){
                    fs.readSync(fd,rd1,0,4);
                    param[store1[i]] = Buffer.from(rd1,0,4).readUInt32LE();
                }
            } 
            await unpack1();
            if(param["magic"] != 0x46535000) {
                await vscode.window.showInformationMessage("Param.sfo is invalid");
                process.exit(1);
            }
            
            async function unpack2(){
                for(i=0; i<param["indexTableEntries"]; i++){
                    var param3 = {}
                    async function unpack3 () {
                        for(j=0; j<5; j++){
                            if(j<2) {
                                fs.readSync(fd,rd2,0,2);
                                param3[store2[j]] = Buffer.from(rd2,0,2).readUInt16LE();
                            }
                            else{
                                fs.readSync(fd,rd1,0,4);
                                param3[store2[j]] = Buffer.from(rd1,0,4).readUInt32LE();
                            }

                        }
                    }
                    await unpack3();
                    entry_table.push(param3);
                }
            }
            await unpack2();
            
            let keyTable = await Buffer.alloc(param["dataTableOffset"] - param["keyTableOffset"]);
            await fs.readSync(fd,keyTable,0, param["dataTableOffset"] - param["keyTableOffset"]);
            
            keyTable = await keyTable.toString('utf8');
            let search, ind, final;
            let type = new Array();
            for(i=0; i<param["indexTableEntries"]; i++){
                search = await keyTable.substr(entry_table[i]["keyOffset"]);
                ind = await search.indexOf("\0");
                final = await search.substr(0,ind);

                if(final == "TITLE_ID"){
                    TITLE_ID = await Buffer.alloc(entry_table[i]["paramLen"]);
                    await fs.readSync(fd,TITLE_ID, 0,entry_table[i]["paramLen"], param["dataTableOffset"] + entry_table[i]["dataOffset"] - 1);
                    TITLE_ID = await TITLE_ID.toString();
                    TITLE_ID = await TITLE_ID.substr(1, entry_table[i]["paramLen"]);
                }
                if(final == "TITLE"){
                    TITLE = await Buffer.alloc(entry_table[i]["paramLen"]);
                    await fs.readSync(fd,TITLE, 0,entry_table[i]["paramLen"], param["dataTableOffset"] + entry_table[i]["dataOffset"] - 1);
                    TITLE = await TITLE.toString();
                    TITLE = await TITLE.substr(1, entry_table[i]["paramLen"]); 
                }
                
                
                
            }
            
        }
        else{
            await vscode.window.showInformationMessage("ERROR: Make sure eboot.bin and param.sfo are in the directory");
            process.exit(1);
        }
    }
    else{
        await vscode.window.showInformationMessage("ERROR: Path not found");
        process.exit(1);
    } 
}

async function fpayload() {
    var config = {
        user: "anonymous",
        password: "@anonymous",
        host: ip_addr,
        port: 1337,
        localRoot: fpath,
        remoteRoot: "ux0:/app/" + TITLE_ID + "/",
        include: ["eboot.bin"],
        deleteRemote: true,
        forcePasv: true
    }; 
    
    var ftpDeploy = await new FtpDeploy();
    ftpDeploy
        .deploy(config)
        .then(res => vscode.window.showInformationMessage("Payload Transferred Successfully"))
        .catch(err => vscode.window.showInformationMessage("ERROR: FTP TRANSFER FAILED"));
    

    await wake();
    await terminate();
    await launch(TITLE_ID);

}

async function fsend() {
    var config = {
        user: "anonymous",
        password: "@anonymous",
        host: ip_addr,
        port: 1337,
        localRoot: fpath,
        remoteRoot: rRoot,
        include: [target],
        deleteRemote: true,
        forcePasv: true
    }; 

    var ftpDeploy = await new FtpDeploy();
    ftpDeploy
        .deploy(config)
        .then(res => vscode.window.showInformationMessage("Target Transferred Successfully"))
        .catch(err => vscode.window.showInformationMessage("ERROR: FTP TRANSFER FAILED"));

}



function activate(context) {
    let IP_cache = new Cache(context);
    
    if(IP_cache.has('ip_addr')){
        ip_addr = IP_cache.get('ip_addr');
        client = new Netcat.client(1338, ip_addr);
    }

    if(IP_cache.has('path')) fpath = IP_cache.get('path');
    console.log('Congratulations, your extension "vitacompanion" is now active!');
    
    let connect_vita = vscode.commands.registerCommand('extension.connect', function () {
        vscode.window.showInputBox({ prompt: 'Enter Your Vita IP - (Format) x.x.x.x' }).then(code => {
            IP_cache.put('ip_addr', code);
            ip_addr = code;
            client = new Netcat.client(1338, ip_addr);
        }) 
        
    });

    let reboot_vita = vscode.commands.registerCommand('extension.reboot', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            client.start();
            client.send('reboot\n',true);
        }
    });

    let screen_on = vscode.commands.registerCommand('extension.screenOn', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else { 
            wake();
        }

    });
    let screen_off = vscode.commands.registerCommand('extension.screenOff', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            client.start();
            client.send('screen off\n',true);
        }
    });
    let launch_vita = vscode.commands.registerCommand('extension.launch', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            vscode.window.showInputBox({ prompt: 'Enter Application ID:' }).then(code => {
                launch(code);
            })
        }
    });
    let destroy_vita = vscode.commands.registerCommand('extension.destroy', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            terminate();
        }
    });

    let send_vita = vscode.commands.registerCommand('extension.send', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else if(!fpath) vscode.window.showInformationMessage("Please register a source first using command >Vita: Set Path")  
        else {
            vscode.window.showInputBox({ prompt: 'Enter the directory on your device where you want your files to be sent ex. ux0:/Vpks' }).then(code => {
                rRoot = code;
                vscode.window.showInputBox({ prompt: 'Enter name of the file you want to send ex. target.vpk' }).then(code => {
                    target = code;
                    fsend();
                }); 
            });
        }        


        
    });

    let set_path = vscode.commands.registerCommand('extension.setpath', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else{
            vscode.window.showInputBox({ prompt: 'Enter the full directory of your project ex. Users/Documents/myproject' }).then(code => {
                fpath = code;
                IP_cache.put('path',fpath);
            });
        }
    });

    let full_deploy = vscode.commands.registerCommand('extension.fulldeploy', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else if(!fpath) vscode.window.showInformationMessage("Please register a source first using command >Vita: Set Path") 
        else{
            async function fdeploy() {
                await check_param();
                await fpayload();
            }
            fdeploy();
        }
        console.log(fpath);
    });


    client.on('data', function (data) {
        vscode.window.showInformationMessage('Received: ' + data); 
    });


    context.subscriptions.push(connect_vita,reboot_vita,screen_on,screen_off,launch_vita,destroy_vita,set_path,send_vita,full_deploy);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;