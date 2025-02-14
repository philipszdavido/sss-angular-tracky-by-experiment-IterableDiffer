export class InsertData  {
    name    : string;
    _id     : string;
    idx     : number;

    constructor(name: string, _id: string, idx: number) {

        this.name   = name;
        this.idx    = idx;
        this._id    = _id
    }
}
