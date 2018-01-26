const ffi = require('ffi');
const ref = require('ref');
const Struct = require('ref-struct');
const ArrayType = require('ref-array');


//Structures
var DevicesList = Struct({
	'names': ArrayType(ref.types.CString),
	'count': 'int'
});

var CardTapResponseStruct = Struct({
	'isSuccess': 'int',
	'errorCode': 'int',
	'uid': ArrayType(ref.types.char, 32)
});

// Native DLL link
var lib = ffi.Library('./Cards/lib/CardsBase.dll',
{ 'createInstanceByName': [ 'pointer', [ ref.types.CString, ref.types.CString] ],
  'destroyInstance': [ 'void', [ 'pointer' ]],
  'runOnCardPresent':[ 'void',[ 'pointer', 'pointer', 'pointer']],
  'getDevicesList': [ DevicesList, [] ],
  'freeDevicesList': [ 'void', [ DevicesList ] ]
 }
);

// Exported functions
module.exports = {
	GetDevices: function()
	{
		devicesArr = []
		devices = lib.getDevicesList();
		devices.names.length = devices.count;

		for(var i = 0; i < devices.count; i++)
		{
			devicesArr.push(devices.names[i]);
		}
		
		lib.freeDevicesList(devices);
		
		return devicesArr;
	},

	//Enums
	CardTapError: Object.freeze({
			1:"InternetError", 
			2:"ApiKeyInvalid",
			3:"TransactionTokenInvalid",
			4:"UserNotAssociatedWithCardReader",
			5:"NoSuchTPID",
			6:"TransactionTokenMissing",
			7:"TransactionTokenDoesntExist",
			8:"TransactionTokenAlreadyUsed",
			9:"TransactionTokenAlreadyValidated"}),
			
	ReaderStatus: Object.freeze({
			1:"Disconnected",
			2:"Connected",
			3:"AlreadyInUse"}),
			
	//Classes
	CardDetails: function(userID)
	{
		this.userID = userID;
	},

	ReaderCredentials: function(apiKey)
	{
		this.apiKey = apiKey;
	},

	ReaderSettings: function(deviceName)
	{
		this.deviceName = deviceName;
	},

	CardTapResponse: function(isSuccess, error, cardDetails)
	{
		this.isSuccess = isSuccess;
		this.error = error;
		this.cardDetails = cardDetails;
	},

	CardReader: function(readerSettings, readerCredentials)
	{
		if(arguments.length == 1)
		{
			this.readerCredentials = readerSettings;
			this.readerSettings = new module.exports.ReaderSettings(module.exports.GetDevices()[0]);
		}
		else
		{
			this.readerSettings = readerSettings;
			this.readerCredentials = readerCredentials;
		}
		
		this.instance = lib.createInstanceByName(this.readerSettings.deviceName, this.readerCredentials.apiKey);
		
		this.onCardTap = null;
		this.onStatusChange = null;
		
		this.listen = function() 
		{
			var internalOnCardTap = ffi.Callback('void', [CardTapResponseStruct], 
				((cardInfo) => 
				{ 
					var uid = "";
					
					for(var i = 0; i < 24; i++)
					{
						uid += String.fromCharCode(cardInfo.uid[i]);
					}
					
					this.onCardTap(new module.exports.CardTapResponse(cardInfo.isSuccess == 1, cardInfo.errorCode, new module.exports.CardDetails(uid)));
				}));
			
			var internalOnStatusChange = ffi.Callback('void', ['int'], this.onStatusChange);
			
			process.on('exit', function() { internalOnCardTap });
			process.on('exit', function() { internalOnStatusChange });
			
			lib.runOnCardPresent(this.instance, internalOnCardTap, internalOnStatusChange);
		};
	}
};
