const Cards = require('./Cards/Cards');

//Handle Card Tap event. This event is raised when a user taps his phone on the reader. 
//Note that Cards must be installed on the phone.
function onCardTap(cardInfo)
{
	if(!cardInfo.isSuccess)
	{
		console.log('Error reading card');
		console.log(Cards.CardTapError[cardInfo.error]);
		
		return;
	}
	
	console.log('Card read, user id: ');
	console.log(cardInfo.cardDetails.userID);
	
	/*Your code goes here!
	Do whatever you want with the accepted User ID!

	-----------------------
	Example: Open the door, if the user is authorized
	-----------------------
	if(YourSystem.IsAuthorizedToOpenDoor(cardInfo.cardDetails.userID, doors.hallway))
	{
		YourSystem.OpenDoor(doors.hallway);
	}
	
	-----------------------
	Example: Remove balance
	----------------------
	YourSystem.Users.ChangeBalance(cardInfo.cardDetails.userID, -10);*/
}

//Handles reader status change.
function onStatusChange(readerStatus)
{
	console.log('Status changed!');
	console.log(Cards.ReaderStatus[readerStatus]);
}

var readerCredentials = new Cards.ReaderCredentials('ABCD1234ABCD1234ABCD1234');
var readerSettings = new Cards.ReaderSettings('ACS - ACR122U PICC Interface');

var reader = new Cards.CardReader(readerSettings, readerCredentials);

reader.onStatusChange = onStatusChange;
reader.onCardTap = onCardTap;

reader.listen();