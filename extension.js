const vscode = require('vscode');
var net = require('net');
var client = new net.Socket();
const Cache = require('vscode-cache');

function activate(context) {
    var ip_addr = 0;
    let IP_cache = new Cache(context);

    if(IP_cache.has('ip_addr')){
        ip_addr = IP_cache.get('ip_addr')
    }

    console.log('Congratulations, your extension "vitacompanion" is now active!');
    
    let connect_vita = vscode.commands.registerCommand('extension.connect', function () {
        vscode.window.showInputBox({ prompt: 'Enter Your Vita IP - (Format) x.x.x.x' }).then(code => {
            IP_cache.put('ip_addr', code)
            ip_addr = code
        }) 
        
    });

    let reboot_vita = vscode.commands.registerCommand('extension.reboot', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            client.connect(1338, ip_addr, function (){
                client.write('reboot\n')
            })
            client.on('data', function(data) {
                vscode.window.showInformationMessage('Received: ' + data);
            })
        }
    });

    let screen_on = vscode.commands.registerCommand('extension.screenOn', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else { 
            client.connect(1338, ip_addr, function (){
                client.write('screen on\n')
            })
        }
    });
    let screen_off = vscode.commands.registerCommand('extension.screenOff', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            client.connect(1338, ip_addr, function (){
                client.write('screen off\n')
            })
        }
    });
    let launch_vita = vscode.commands.registerCommand('extension.launch', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            vscode.window.showInputBox({ prompt: 'Enter Application ID:' }).then(code => {
                client.connect(1338, ip_addr, function (){
                    client.write('launch ' + code + '\n')
                }) 
            })
        }
    });
    let destroy_vita = vscode.commands.registerCommand('extension.destroy', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            client.connect(1338, ip_addr, function (){
                client.write('destroy\n')
            })
        }
    });



    context.subscriptions.push(connect_vita,reboot_vita,screen_on,screen_off,launch_vita,destroy_vita);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;