import { Op } from "../Op"
/**
 * The abstract action
 */
export abstract class  AbstractAction extends Op {
    /**
     * The scope
     */
    scope : any

    /**
     * The constructor
     * @param scope the scope
     */
    constructor(scope : any){
        super()
        this.scope = scope
    }

    /**
     * Evaluates the action given a certain set of parameters
     * @param params the parameters
     */
    abstract evaluate(params : any) : Promise<AbstractAction>
}