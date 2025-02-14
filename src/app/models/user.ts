export class User {
	_id     : string;
	email   : string;
	level   : string;
	token  ?: string;

	constructor(username: string) {
		this._id 	= username;
		this.level 	= "user";
	}
}


