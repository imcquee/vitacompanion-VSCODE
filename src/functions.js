const vscode = require('vscode');
const fs = require('fs');
const dir = require("path");
const glob = require("glob");
const AdmZip = require('adm-zip');

async function launch (ip_addr,target,client,ftp){
    var found = 0;
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

function rbt(client){
    client.start();
    client.send('reboot\n',true);
}

function Soff(client) {
    client.start();
    client.send('screen off\n',true);
}

function wake(client) {
    client.start();
    client.send('screen on\n', true);
}

function terminate(client){
    client.start();
    client.send('destroy\n', true);
}

function survive(client, state) {
    if(!state) {
        vscode.window.showInformationMessage("KEEPING SCREEN ON, PLEASE REMEMBER TO TURN OFF (CALL THIS COMMAND AGAIN) THIS CAN DEPLETE YOUR BATTERY AND CAUSE SCREEN BURN IN");
        state = setInterval(function() {
            
            client.start();
            client.send('screen on\n', true);
        }, 100);
        return state;
    }
    else{
        vscode.window.showInformationMessage("KEEP ALIVE MODE ENDED"); 
        clearInterval(state); 
        
    } 
    return 0;
}


async function chd (pth) {
    try {
        process.chdir(pth);
    } catch (err) {
        await vscode.window.showInformationMessage("ERROR: Cannot access this directory");
        process.exit(1);
    }
}

async function check_param(fpath) {
    var eboot = 0;
    var param = 0;
    var vpk = 0;
    result = await fromDir(fpath,"*.{vpk,sfo,bin}");
    for(i=0;i<result.length;i++){
        if(dir.extname(result[i]) == '.vpk') vpk = result[i];
        if(dir.basename(result[i]) == 'eboot.bin') eboot = result[i];
        if(dir.basename(result[i]) == 'param.sfo') param = result[i];
    }
    
    if(eboot && param) {
        let fd = fs.openSync(param,'r');
        
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
        for(i=0; i<param["indexTableEntries"]; i++){
            search = await keyTable.substr(entry_table[i]["keyOffset"]);
            ind = await search.indexOf("\0");
            final = await search.substr(0,ind);

            if(final == "TITLE_ID"){
                TITLE_ID = await Buffer.alloc(entry_table[i]["paramLen"]);
                await fs.readSync(fd,TITLE_ID, 0,entry_table[i]["paramLen"], param["dataTableOffset"] + entry_table[i]["dataOffset"] - 1);
                TITLE_ID = await TITLE_ID.toString();
                var retT = await TITLE_ID.substr(1, entry_table[i]["paramLen"])
                //IP_cache.put(param,retT);
                return(retT);
                
            }
        }
        
    }
    else if(vpk){
        uzip(vpk,fpath);
        return check_param(fpath);
        
    }
    else{
        await vscode.window.showInformationMessage("ERROR: Make sure eboot.bin and param.sfo, or a vpk is in the directory");
            process.exit(1)
    }

}



async function fpayload(fpath, ip_addr,client,TITLE_ID,ftpDeploy,ftp) {
    var npath = 0;
    var ebf = await fromDir(fpath,'eboot.bin');
    if(ebf) npath = ebf[0]
    
    await chd(dir.dirname(npath));
    
    var config = {
        user: "anonymous",
        password: "@anonymous",
        host: ip_addr,
        port: 1337,
        localRoot: fpath,
        remoteRoot: "ux0:/app/" + TITLE_ID + "/",
        include: ["eboot.bin","*.lua"],
        deleteRemote: true,
        forcePasv: true
    }; 

    ftpDeploy
        .deploy(config)
        .then(res => vscode.window.showInformationMessage("Payload Transferred Successfully"))
        .catch(err => vscode.window.showInformationMessage("ERROR: FTP TRANSFER FAILED"));
    

    await wake(client);
    await terminate(client);
    await launch(ip_addr,TITLE_ID,client,ftp);

}

async function fdeploy(fpath,ip_addr,client,ftpDeploy,ftp) {
    var TITLE_ID = await check_param(fpath);
    await fpayload(fpath,ip_addr,client,TITLE_ID,ftpDeploy,ftp);
}

async function fsend(rRoot,fpath,ip_addr,target,ftpDeploy) {
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

    ftpDeploy
        .deploy(config)
        .then(res => vscode.window.showInformationMessage("Target Transferred Successfully"))
        .catch(err => vscode.window.showInformationMessage("ERROR: FTP TRANSFER FAILED"));

}

async function fromDir(fpath,filter){
    if(fs.existsSync(fpath)) {
        await chd(fpath);
        var npath = 0;
        var start = "**/" + filter;
        var ebf = glob.sync(start, {realpath: true, root: fpath, stat: true});
        if(ebf) {
            return ebf;
        }
        else{
            await vscode.window.showInformationMessage("ERROR: Make sure eboot.bin and param.sfo are in the directory");
            return null;
        }
    }
    else{
        await vscode.window.showInformationMessage("ERROR: Path not found");
        return null;
    }  
};

async function deb(fpath,ip_addr,client,ftpDeploy,ftp) {
    var result = await fromDir(fpath,'eboot.bin');
    var eboot = 0;
    for(i=0;i<result.length;i++){
        if(dir.basename(result[i]) == 'eboot.bin') eboot = result[i];
    }
    eboot = eboot.toString();
    fdeploy(fpath,ip_addr,client,ftpDeploy,ftp); 
    if(eboot)return dir.dirname(eboot);
    else return 0;
};

async function uzip(vpk,fpath){
    var zip = new AdmZip(vpk);
    await zip.extractAllTo(fpath+"/tempV");
    
}



module.exports = {
    launch,
    wake,
    terminate,
    check_param,
    fpayload,
    fsend,
    survive,
    chd,
    fromDir,
    fdeploy,
    deb,
    rbt,
    Soff,
}