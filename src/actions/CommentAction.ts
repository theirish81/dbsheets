import { AbstractAction } from "./AbstractAction";
import util from 'util'
/**
 * Produces a comment in the console
 */
export class CommentAction extends AbstractAction {

    evaluate(params: any): Promise<AbstractAction> {
        return new Promise((resolve,reject)=> {
            if(params.environment){
                console.log("Comment:", params.environment+"="+util.inspect(this.scope[params.environment],{showHidden:false, depth:null, colors:true}))
            }
            if(params.ds) {
                console.log("Comment:", params._ds+"=",params.ds.getData())
            }
            return resolve(this)
        })
    }

}