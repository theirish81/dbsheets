import { AbstractDataSource, JoinOn, FieldComparator } from "./datasources/AbstractDataSource"
import { MongoDataSource } from "./datasources/MongoDataSource"
import { PostgresDataSource } from "./datasources/PostgresDataSource"
import { JoinedDataSource } from "./datasources/JoinedDataSource"
import { PublicDataSource } from "./datasources/PublicDataSource"
import { AbstractAction } from "./actions/AbstractAction"
import { SetVarAction } from "./actions/SetVarAction"
import { CommentAction } from "./actions/CommentAction"

export class Sheet {

    sheet : Array<any>

    sheetScope : Map<string,AbstractDataSource> = new Map<string,AbstractDataSource>()

    varScope : any

    constructor(sheet : Array<any>, varScope : any) {
        this.sheet = sheet
        this.varScope = varScope
    }

    async process() : Promise<void> {
        const iterator = this.sheet[Symbol.iterator]()
        return this.operate(iterator)
    }

    private operate(iterator : IterableIterator<any>) : Promise<void> {
        const item = iterator.next()
        if(item.done)
            return
        const operation = item.value
        switch(operation.op){
            case 'datasource':
                let datasourceObject : AbstractDataSource
                let datasourcePromise : Promise<AbstractDataSource>
                if(operation.type=='mongodb') {
                    datasourceObject = new MongoDataSource(operation.connection,this.varScope)
                    datasourcePromise = datasourceObject.find(operation)
                }
                if(operation.type=='postgres') {
                    datasourceObject = new PostgresDataSource(operation.connection,this.varScope)
                    datasourcePromise = datasourceObject.find(operation)
                }
                if(operation.type=='joined') {
                    const joinOn = new JoinOn(operation.joinOn.leftSelector,operation.joinOn.rightSelector,operation.joinOn.operation)
                    const localParams = Object.assign({},operation)
                    localParams.ds1 = this.sheetScope.get(operation.ds1)
                    localParams.ds2 = this.sheetScope.get(operation.ds2)
                    localParams.joinOn = joinOn
                    datasourceObject = new JoinedDataSource(operation.id,this.varScope)
                    datasourcePromise = datasourceObject.find(localParams)
                }
                if(operation.type=='public') {
                    const localParams = Object.assign({},operation)
                    localParams.ds = this.sheetScope.get(operation.ds)
                    datasourceObject = new PublicDataSource(this.varScope)
                    datasourcePromise = datasourceObject.find(localParams)
                }
                return datasourcePromise.then(it => it.close().then(_ => it))
                                    .then(it => {
                                        this.sheetScope.set(operation.var,it)
                                        return this.operate(iterator)
                                    }).catch(e => {
                                        console.log('Error',e.message)
                                        datasourceObject.close()
                                    })
            case 'action':
                let opPromise : Promise<AbstractAction>
                if(operation.type == 'setVar') {
                    const localParams = Object.assign({},operation)
                    localParams.ds = this.sheetScope.get(operation.ds)
                    opPromise = new SetVarAction(this.varScope).evaluate(localParams)
                }
                if(operation.type == 'comment') {
                    const localParams = Object.assign({},operation)
                    if(localParams.ds){
                        localParams._ds = localParams.ds
                        localParams.ds = this.sheetScope.get(operation.ds)
                    }
                    opPromise = new CommentAction(this.varScope).evaluate(localParams)
                }
                return opPromise.then(_ => {
                    return this.operate(iterator)
                })
        }
        
    }
}