cd app
start cmd /k npx expo start --clear --port 3000
cd ../server
start cmd /k tsc --watch
start cmd /k npm run dev
@REM cd ../bot
@REM start cmd /k tsc -w
@REM start cmd /k node ./dist/index.js
cd ..
start C:\Users\casso\AppData\Local\MongoDBCompass\MongoDBCompass.exe