# vitacompanion VSCODE extension

This extension allows you to connect to the vita using the protocol created by devnoname120 https://github.com/devnoname120/vitacompanion

## Installing

Install from here: https://marketplace.visualstudio.com/items?itemName=imcquee.vitacompanion

Or search 'vitacompanion' in VSCODE extension search

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
## Send Files

First call "Set Path" to set your path to the folder on your computer with the file or folder you want to send

Then run "Send File or Folder" and you will be prompted to enter the file or folder name to send to the device

```
>Vita: Set Path
>Vita: Send and Run Payload
```

## Send Payload

First call "Set Path" to set your path to the folder on your computer that holds your applications eboot.bin and param.sfo files (or vpk)

Then run "Send and Run Payload", this will send the new eboot.bin to your device, wake it up, close all other applications, and finally launch the new version

```
>Vita: Set Path
>Vita: Debug Mode
```
Then run "Debug Mode", this will listen for changes made to the eboot.bin file and then launch your application after a change occurs. Simply run make and the new version will be installed and launched on the device. 

By default it will keep the screen on. You can turn this off by using the ">Vita: Keep Vita Awake" command.

## Keep Vita Awake

```
>Vita: Keep Vita Awake
```

This will intermittenly send a command to keep your Vita screen on. In a future update it will be able to kep your device awake without the screen on.

## Debug Mode

First call "Set Path" to set your path to the folder on your computer that holds your applications eboot.bin and param.sfo files (or vpk)




## Touchbar Controls

**X** = Kill all applications

☾ = Screen Off

☀ = Screen On

↺ = Reboot

↑ = Turn Debug Mode On and Off


Massive thanks to devnoname120 - https://github.com/devnoname120 for Vita Companion

Additional thanks to Rinnegatamante - https://github.com/Rinnegatamante for his php implementation of a param.sfo parseer
