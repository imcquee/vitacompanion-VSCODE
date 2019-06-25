const vscode = require('vscode');
var net = require('net');
//var client = new net.Socket();
const Netcat = require('node-netcat');
const Cache = require('vscode-cache');

function activate(context) {
    var ip_addr = 0;
    let IP_cache = new Cache(context);
    var client = 0;

    if(IP_cache.has('ip_addr')){
        ip_addr = IP_cache.get('ip_addr')
        client = new Netcat.client(1338, ip_addr)
    }

    console.log('Congratulations, your extension "vitacompanion" is now active!');
    
    let connect_vita = vscode.commands.registerCommand('extension.connect', function () {
        vscode.window.showInputBox({ prompt: 'Enter Your Vita IP - (Format) x.x.x.x' }).then(code => {
            IP_cache.put('ip_addr', code)
            ip_addr = code
            client = new Netcat.client(1338, ip_addr)
        }) 
        
    });

    let reboot_vita = vscode.commands.registerCommand('extension.reboot', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            client.start()
            client.send('reboot\n',true);
        }
    });

    let screen_on = vscode.commands.registerCommand('extension.screenOn', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else { 
            client.start()
            client.send('screen on\n', true);
        }
    });
    let screen_off = vscode.commands.registerCommand('extension.screenOff', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            client.start()
            client.send('screen off\n',true)
        }
    });
    let launch_vita = vscode.commands.registerCommand('extension.launch', function () {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            vscode.window.showInputBox({ prompt: 'Enter Application ID:' }).then(code => {
                client.start()
                client.send('launch ' + code + '\n', true);
            })
        }
    });
    let destroy_vita = vscode.commands.registerCommand('extension.destroy', function() {
        if(!ip_addr) vscode.window.showInformationMessage("Connect to the Vita first using command >Vita: Connect")
        else {
            client.start()
            client.send('destroy\n', true);
        }
    });

    client.on('data', function (data) {
        vscode.window.showInformationMessage('Received: ' + data); 
    });



    context.subscriptions.push(connect_vita,reboot_vita,screen_on,screen_off,launch_vita,destroy_vita);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;