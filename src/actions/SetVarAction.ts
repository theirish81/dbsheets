import { AbstractAction } from "./AbstractAction";
import { Op } from "../Op";

export class SetVarAction extends AbstractAction {


    evaluate(params : any) : Promise<AbstractAction> {
        return new Promise((resolve,reject)=> {
                    if(params.first){
                        this.scope[params.var] = Op.fetchValue(params.ds.getData()[0],params.first)
                    }
                    if(params.multiple){
                        this.scope[params.var] = params.ds.getData().map((it : any) => Op.fetchValue(it,params.multiple))
                    }
                    return resolve(this)
                })
        
    }
}