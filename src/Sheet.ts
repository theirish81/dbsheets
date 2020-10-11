import { AbstractDataSource, JoinOn, FieldComparator } from "./datasources/AbstractDataSource"
import { MongoDataSource } from "./datasources/MongoDataSource"
import { PostgresDataSource } from "./datasources/PostgresDataSource"
import { JoinedDataSource } from "./datasources/JoinedDataSource"
import { PublicDataSource } from "./datasources/PublicDataSource"
import { AbstractAction } from "./actions/AbstractAction"
import { SetVarAction } from "./actions/SetVarAction"
import { CommentAction } from "./actions/CommentAction"
/**
 * The Sheet is a descriptor of the actions that need to be done.
 */
export class Sheet {

    /**
     * The Array of instructions
     */
    sheet : Array<any>

    /**
     * The scope of the sheet
     */
    sheetScope : Map<string,AbstractDataSource> = new Map<string,AbstractDataSource>()

    /**
     * Extra variables coming from the execution
     */
    varScope : any

    /**
     * Constructor
     * @param sheet the sequence of instructions
     * @param varScope extra variables
     */
    constructor(sheet : Array<any>, varScope : any) {
        this.sheet = sheet
        this.varScope = varScope
    }

    /**
     * Processes the sheet
     */
    async process() : Promise<void> {
        const iterator = this.sheet[Symbol.iterator]()
        return this.operate(iterator)
    }

    /**
     * Operates on an interator of operations
     * @param iterator the iterator
     */
    private operate(iterator : IterableIterator<any>) : Promise<void> {
        const item = iterator.next()
        // Iterator done, then we're done
        if(item.done)
            return
        const operation = item.value
        switch(operation.op){
            // If the operation is a datasource
            case 'datasource':
                let datasourceObject : AbstractDataSource
                let datasourcePromise : Promise<AbstractDataSource>
                // If the operation is MongoDB...
                if(operation.type=='mongodb') {
                    datasourceObject = new MongoDataSource(operation.connection,this.varScope)
                    // MongoDB is the only database that can perform updates
                    if(operation.update)
                        datasourcePromise = (datasourceObject as MongoDataSource).update(operation)
                    else
                        datasourcePromise = datasourceObject.find(operation)
                }
                // If the operation is PostgreSQL...
                if(operation.type=='postgres') {
                    datasourceObject = new PostgresDataSource(operation.connection,this.varScope)
                    datasourcePromise = datasourceObject.find(operation)
                }
                // If the operation is a join...
                if(operation.type=='joined') {
                    const joinOn = new JoinOn(operation.joinOn.leftSelector,operation.joinOn.rightSelector,operation.joinOn.operation)
                    const localParams = Object.assign({},operation)
                    localParams.ds1 = this.sheetScope.get(operation.ds1)
                    localParams.ds2 = this.sheetScope.get(operation.ds2)
                    localParams.joinOn = joinOn
                    datasourceObject = new JoinedDataSource(operation.id,this.varScope)
                    datasourcePromise = datasourceObject.find(localParams)
                }
                // If the operation is a "public", that is the exposure of a datasource as a result
                if(operation.type=='public') {
                    const localParams = Object.assign({},operation)
                    localParams.ds = this.sheetScope.get(operation.ds)
                    datasourceObject = new PublicDataSource(this.varScope)
                    datasourcePromise = datasourceObject.find(localParams)
                }
                // Exetute the determined promise
                return datasourcePromise.then(it => it.close().then(_ => it))
                                    .then(it => {
                                        this.sheetScope.set(operation.var,it)
                                        return this.operate(iterator)
                                    }).catch(e => {
                                        datasourceObject.close()
                                        throw e
                                    })
            // If it's an "action time"
            case 'action':
                let opPromise : Promise<AbstractAction>
                // And if the action is setting a variable
                if(operation.type == 'setVar') {
                    const localParams = Object.assign({},operation)
                    localParams.ds = this.sheetScope.get(operation.ds)
                    opPromise = new SetVarAction(this.varScope).evaluate(localParams)
                }
                // And if the action is a comment
                if(operation.type == 'comment') {
                    const localParams = Object.assign({},operation)
                    if(localParams.ds){
                        localParams._ds = localParams.ds
                        localParams.ds = this.sheetScope.get(operation.ds)
                    }
                    opPromise = new CommentAction(this.varScope).evaluate(localParams)
                }
                // Then we can operate
                return opPromise.then(_ => {
                    return this.operate(iterator)
                })
        }
        
    }

    // Conting the data sources that represent exposures of data
    resultsCount() : number {
        let count = 0
        for (const v of this.sheetScope.values())
            if(v instanceof PublicDataSource)
                count++
        return count
    }
}