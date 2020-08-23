import { Op } from "../Op"

export abstract class  AbstractAction extends Op {
    scope : any

    constructor(scope : any){
        super()
        this.scope = scope
    }

    abstract evaluate(params : any) : Promise<AbstractAction>
}