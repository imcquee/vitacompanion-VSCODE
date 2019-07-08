# vitacompanion VSCode extension

This extension allows you to operate your PS Vita right from the Visual Studio Code IDE. This means that you can send and launch and close apps on your Vita without touching it!

This makes developing homebrews and plugins for the Vita tremendously easier.

**Note**: This extension uses and requires [vitacompanion](https://github.com/devnoname120/vitacompanion) in order to be able to transfer files and send commands to your Vita. See [Installing](#Installing) below to learn how to install it.


## Installing

### Vitacompanion

This extension requires [vitacompanion](https://github.com/devnoname120/vitacompanion) to be installed and running on your Vita.
First you need to download it from the [releases section](https://github.com/devnoname120/vitacompanion/releases).
Then you need to follow the [instructions](https://github.com/devnoname120/vitacompanion#readme) to install it.

### This extension

Install from here: https://marketplace.visualstudio.com/items?itemName=imcquee.vitacompanion
Or search 'vitacompanion' using VSCode extension search.

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
>Vita: Kill all Applications
```

## Additional Commands

## Send File

```
>Vita: Set Path
>Vita: Send File or Folder
```


First call "Set Path" to set your path to the folder on your computer with the file or folder you want to send

Then run "Send File or Folder" and you will be prompted to enter the file or folder name to send to the device

## Send Payload

```
>Vita: Set Path
>Vita: Send and Run Payload
```

First call "Set Path" to set your path to the folder on your computer that holds your applications eboot.bin and param.sfo files or vpk file. NOTE: INPUT FILES CAN NOW BE IN ANY SUBDIRECTORY AS WELL

Then run "Send and Run Payload", this will send the new eboot.bin to your device, wake it up, close all other applications, and finally launch the new version

## Debug Mode

```
>Vita: Set Path
>Vita: Debug Mode
```

First call "Set Path" to set your path to the root folder on your computer that holds your applications eboot.bin and param.sfo files or vpk file. NOTE: INPUT FILES CAN NOW BE IN ANY SUBDIRECTORY AS WELL

Then run "Debug Mode", this will send an initial payload similar to "Send and Run Payload" command. It will then listen for changes made to the eboot.bin file and then launch your application after a change occurs. Simply run make and the new version should be installed and launched on the device. 

By default it will keep the screen on. You can turn this off by using the ">Vita: Keep Vita Awake" command.

## Keep Vita Awake

```
>Vita: Keep Vita Awake
```

This will intermittenly send a command to keep your device screen on. In a future update it will be able to keep your device awake without the screen on.





## Touchbar Controls

**X** = Kill all applications

☾ = Screen Off

☀ = Screen On

↺ = Reboot

↑ = Turn Debug Mode On and Off


Massive thanks to devnoname120 - https://github.com/devnoname120 for Vita Companion

Additional thanks to Rinnegatamante - https://github.com/Rinnegatamante for his php implementation of a param.sfo parseer
