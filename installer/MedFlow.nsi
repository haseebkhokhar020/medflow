; MedFlow per-user NSIS installer. Business data remains under Electron's userData/data,
; never in $INSTDIR; uninstall must not remove customer records.
Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!ifndef APP_DIR
  !error "Pass /DAPP_DIR=<path to win-unpacked>"
!endif
!ifndef OUT_FILE
  !error "Pass /DOUT_FILE=<output exe>"
!endif
!ifndef APP_ICON
  !error "Pass /DAPP_ICON=<ico file>"
!endif
Name "MedFlow"
OutFile "${OUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\MedFlow"
InstallDirRegKey HKCU "Software\MedFlow" "InstallPath"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 16
!define MUI_ABORTWARNING
!define MUI_ICON "${APP_ICON}"
!define MUI_UNICON "${APP_ICON}"
!define MUI_FINISHPAGE_RUN "$INSTDIR\MedFlow.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "${LICENSE_FILE}"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Section "MedFlow" SEC_APP
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  File /r "${APP_DIR}/*"
  File /oname=medflow.ico "${APP_ICON}"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\MedFlow" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow" "DisplayName" "MedFlow Pharmacy"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow" "Publisher" "MedFlow"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow" "DisplayIcon" "$INSTDIR\medflow.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow" "NoRepair" 1
  CreateDirectory "$SMPROGRAMS\MedFlow"
  CreateShortCut "$SMPROGRAMS\MedFlow\MedFlow.lnk" "$INSTDIR\MedFlow.exe" "" "$INSTDIR\medflow.ico" 0
  CreateShortCut "$SMPROGRAMS\MedFlow\Uninstall MedFlow.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd
Section /o "Desktop shortcut" SEC_DESKTOP
  CreateShortCut "$DESKTOP\MedFlow.lnk" "$INSTDIR\MedFlow.exe" "" "$INSTDIR\medflow.ico" 0
SectionEnd
Section "Uninstall"
  SetShellVarContext current
  Delete "$DESKTOP\MedFlow.lnk"
  Delete "$SMPROGRAMS\MedFlow\MedFlow.lnk"
  Delete "$SMPROGRAMS\MedFlow\Uninstall MedFlow.lnk"
  RMDir "$SMPROGRAMS\MedFlow"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MedFlow"
  DeleteRegKey HKCU "Software\MedFlow"
  RMDir /r "$INSTDIR"
  ; Intentionally preserve %APPDATA%\MedFlow\data and all user databases/backups.
SectionEnd
