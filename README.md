# vitacompanion VSCODE extension

This extension allows you to connect to the vita using the protocol created by devnoname120

## Installing

Make sure you have vitacompanion.suprx setup correctly

https://github.com/devnoname120/vitacompanion

Download vsix from releases tab

install using this command 
```
code --install-extension vitacompanion-0.0.1.vsix
```

## Connecting for the first time

Connect to the vita using this command in the command palette
```
>Vita: Connect
```

You will be prompted to enter the IP address in x.x.x.x format ex -> 128.23.21.1

It will save this value so you don't have to call connect everytime

To change it call connect again

You will then be able to use each of the commands set by devnoname120
```
>Vita: Reboot
>Vita: Launch Application by ID
>Vita: Screen off
>Vita: Screen on
```

## Additional Commands

```
>Vita: Set Path
>Vita: Send File or Folder
```
First call "Set Path" to set your path to the folder on your computer with the file or folder you want to send

Then run "Send File or Folder" and you will be prompted to enter the file or folder name to send to the device

```
>Vita: Set Path
>Vita: Send and Run Payload
```

First call "Set Path" to set your path to the folder on your computer that holds your applications eboot.bin and param.sfo files

Then run "Send and Run Payload, this will send the new eboot.bin to your device, wake it up, close all other applications, and finally launch the new version

## Touchbar Controls

**X** = Kill all applications

☾ = Screen Off

☀ = Screen On

↺ = Reboot

↑ = Send and Run Payload


Massive thanks to devnoname120 for Vita Companion
