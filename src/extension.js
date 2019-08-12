const vscode = require('vscode');
const Netcat = require('node-netcat');
const Cache = require('vscode-cache');
const FtpDeploy = require("ftp-deploy");
const PromiseFtp = require('promise-ftp');
const utils = require('./functions');
const chokidar = require('chokidar');
const dir = require("path");

function activate(context) {

    console.log('Congratulations, your extension "vitacompanion" is now active!');

    var watcher = 0;
    var watcher2 = 0;
    var vpk = 0;
    var ftp = new PromiseFtp();
    let IP_cache = new Cache(context);
    var ftpDeploy = new FtpDeploy();
    var client = 0;
    var fpath = 0;
    var ip_addr = 0;
    var rRoot = 0;
    var target = 0;
    var DMODE = 0;
    var SMODE = 0;
    var eboot = 0;

    if(IP_cache.has('ip_addr')){
        ip_addr = IP_cache.get('ip_addr');
        client = new Netcat.client(1338, ip_addr);
    }

    if(IP_cache.has('path')) fpath = IP_cache.get('path');
    
    
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
            utils.rbt(client)
        }
    });

    let screen_on = vscode.commands.registerCommand('extension.screenOn', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else { 
            utils.wake(client);
        }

    });
    let screen_off = vscode.commands.registerCommand('extension.screenOff', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            utils.Soff(client);
        }
    });
    let launch_vita = vscode.commands.registerCommand('extension.launch', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            vscode.window.showInputBox({ prompt: 'Enter Application ID:' }).then(code => {
                utils.launch(ip_addr,code,client,ftp);
            })
        }
    });
    let destroy_vita = vscode.commands.registerCommand('extension.destroy', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            utils.terminate(client);
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
                    utils.fsend(rRoot,fpath,ip_addr,target,ftpDeploy);
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
            utils.fdeploy(fpath,ip_addr,client,ftpDeploy,ftp);
        }
    });


    let debug_mode = vscode.commands.registerCommand('extension.debugmode', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else if(!fpath) vscode.window.showInformationMessage("Please register a source first using command >Vita: Set Path") 
        else{
            async function debug_init() {
                if(DMODE == 1){
                    SMODE = utils.survive(client,SMODE);
                    vscode.window.showInformationMessage("Debug Mode: Ended");
                    DMODE = 0;
                    if(vpk) {
                        await utils.chd(dir.dirname(vpk)); 
                        if(watcher2) watcher2.unwatch(vpk);
                    }
                    if(eboot) {
                        utils.chd(eboot); 
                        if(watcher) watcher.unwatch('eboot.bin');
                    }
                    
                } 
                else {
                    SMODE = utils.survive(client,0);
                    vscode.window.showInformationMessage("Debug Mode: Started");
                    DMODE = 1;
                    vpk = await utils.fromDir(fpath,'*.vpk'); 
                    if(vpk) vpk = vpk[0];
                    if(vpk){
                        await utils.chd(dir.dirname(vpk));
                        watcher2 = chokidar.watch(vpk).on('change', (event, path) => {
                            utils.fdeploy(fpath,ip_addr,client,ftpDeploy,ftp); 
                        });
                    } 
                    eboot = await utils.deb(fpath,ip_addr,client,ftpDeploy,ftp);
                    if(eboot) utils.chd(eboot);

                    watcher = chokidar.watch('eboot.bin').on('change', (event, path) => {
                        utils.fdeploy(fpath,ip_addr,client,ftpDeploy,ftp); 
                    });
                }
            }
            debug_init();
        }
    });

    let stay_on = vscode.commands.registerCommand('extension.stayon', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else{
            SMODE = utils.survive(client,SMODE);
        }
    });



    if(client) client.on('data', function (data) {
        if(!SMODE) vscode.window.showInformationMessage('Received: ' + data); 
    });




    context.subscriptions.push(connect_vita,reboot_vita,screen_on,screen_off,launch_vita,destroy_vita,set_path,send_vita,full_deploy,debug_mode,stay_on);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;