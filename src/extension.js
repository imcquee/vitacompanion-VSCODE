const vscode = require('vscode');
const Netcat = require('node-netcat');
const FtpDeploy = require("ftp-deploy");
const PromiseFtp = require('promise-ftp');
const utils = require('./functions');
const chokidar = require('chokidar');
const dir = require("path");

function activate(context) {

    console.log('Congratulations, your extension "vitacompanion" is now active!');

    let configuration = vscode.workspace.getConfiguration("vitacompanion")
    var watcher = 0;
    var watcher2 = 0;
    var vpk = 0;
    var ftp = new PromiseFtp();
    var ftpDeploy = new FtpDeploy();
    var client = undefined;
    var DMODE = 0;
    var SMODE = 0;
    var eboot = 0;

    function ipAddress() {
        return vscode.workspace.getConfiguration("vitacompanion").get("ipAddress")
    }

    function getSourcePath() {
        return vscode.workspace.getConfiguration("vitacompanion").get('ftp.sourcePath');
    }

    function getTargetPath() {
        return vscode.workspace.getConfiguration("vitacompanion").get('ftp.targetPath');
    }

    if(ipAddress()) {
        client = new Netcat.client(1338, ipAddress());
    }

    let connect_vita = vscode.commands.registerCommand('extension.connect', function () {
        vscode.window.showInputBox({ prompt: 'Enter Your Vita IP - (Format) x.x.x.x', value: ipAddress() }).then(address => {
            if (address != undefined) {
                configuration.update('ipAddress', address);
                client = new Netcat.client(1338, address);
            }
        }) 
        
    });

    let reboot_vita = vscode.commands.registerCommand('extension.reboot', function () {
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            utils.rbt(client)
        }
    });

    let screen_on = vscode.commands.registerCommand('extension.screenOn', function () {
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else { 
            utils.wake(client);
        }

    });
    let screen_off = vscode.commands.registerCommand('extension.screenOff', function () {
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            utils.Soff(client);
        }
    });
    let launch_vita = vscode.commands.registerCommand('extension.launch', function () {
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            vscode.window.showInputBox({ prompt: 'Enter Application ID:' }).then(code => {
                utils.launch(ipAddress(),code,client,ftp);
            })
        }
    });
    let destroy_vita = vscode.commands.registerCommand('extension.destroy', function() {
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            utils.terminate(client);
        }
    });

    let send_vita = vscode.commands.registerCommand('extension.send', function() {
        let path = getSourcePath()
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else if(!path) vscode.window.showInformationMessage("Please register a source first using command >Vita: Set Path")
        else if(!getTargetPath()) vscode.window.showInformationMessage("Please set a target folder first using command >Vita: Set Target Path")
        else {
            //console.log("path Uri " + vscode.Uri.file(path));
            vscode.workspace.fs.readDirectory(vscode.Uri.file(path)).then(elements => {
                //console.log("elements " + elements);
                let items = elements.filter(e => e[1] == vscode.FileType.File)
                    .map(e => e[0])
                //console.log("items " + items);

                let previousFile = context.workspaceState.get("previousFile");
                //console.log("previousFile " + previousFile);
                vscode.window.showQuickPick(items, {
                    placeHolder: previousFile
                }).then(picked => {
                    //console.log("picked " + picked);
                    if (picked) {
                        context.workspaceState.update("previousFile", picked)
                        utils.fsend(getTargetPath(), path, ipAddress(), picked, ftpDeploy)
                    }
                });
            });
        }
    });

    let set_path = vscode.commands.registerCommand('extension.setpath', function() {
        vscode.window.showOpenDialog({
             openLabel: 'Choose Source Directory',
             defaultUri: vscode.workspace.workspaceFolders[0].uri,
             canSelectFiles: false,
             canSelectFolders: true
     }).then(dirs => {
            console.log("change source path to " + dirs[0].fsPath);
            if (dirs != undefined) {
                configuration.update("ftp.sourcePath", dirs[0].fsPath);
            }
        });
    });

    let set_target_path = vscode.commands.registerCommand('extension.settargetpath', function() {
        vscode.window.showInputBox({ 
            prompt: 'Enter the directory on your device where you want your files to be sent ex. ux0:/Vpks',
            value: getTargetPath()
         }).then(targetPath => {
            console.log("change target path to " + targetPath)
            configuration.update("ftp.targetPath", targetPath);
        });
    });

    let full_deploy = vscode.commands.registerCommand('extension.fulldeploy', function() {
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else if(!getSourcePath()) vscode.window.showInformationMessage("Please register a source first using command >Vita: Set Path") 
        else{
            utils.fdeploy(getSourcePath(),ipAddress(),client,ftpDeploy,ftp);
        }
    });


    let debug_mode = vscode.commands.registerCommand('extension.debugmode', function() {
        let fpath = getSourcePath();
        let ip_addr = ipAddress();
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
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
        if(!client) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else{
            SMODE = utils.survive(client,SMODE);
        }
    });

    if(client) client.on('data', function (data) {
        if(!SMODE) vscode.window.showInformationMessage('Received: ' + data); 
    });


    context.subscriptions.push(connect_vita,reboot_vita,screen_on,screen_off,launch_vita,destroy_vita,set_path,send_vita,full_deploy,debug_mode,stay_on,set_target_path);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;