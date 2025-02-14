import { Ancestry } from "./ancestry"

export class Subscription {
    id          : string;
    ancestry    : Ancestry;

    constructor(id: string, ancestry: Ancestry)
    {
        this.id         = id;
        this.ancestry   = ancestry;
    }
}