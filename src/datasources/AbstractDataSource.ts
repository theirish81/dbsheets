import { Config } from "../Config"
import mustache from 'mustache'
import { Op } from "../Op"

export abstract class AbstractDataSource extends Op {

    connectionParams : any

    protected data : Array<any>

    id : string

    scope : any

    constructor(connectionParams : any = null, scope : any) {
        super()
        if(typeof(connectionParams)=='string')
            this.connectionParams = Config.getInstance().datasources[connectionParams]
        else
            this.connectionParams = connectionParams
        this.data = new Array<any>()
        this.scope = scope
    }

    getData() : Array<any> {
        return this.data
    }

    

    abstract find(params : any ) : Promise<AbstractDataSource>

    static project(row : any, projections: Array<string> ) : any {
        if(projections == null)
            return row
        const item : any = {}
        projections.forEach(key => item[key] = row[key])
        return item
    }

    static createFilterComparators(operation : any) : Array<FieldComparator> {
        return operation.accept?.map((it : any) => new FieldComparator(it.leftSelector,it.value,it.operation))
    }

    static accept(row : any,filters : Array<FieldComparator>) : any {
        let pass = true
        if(filters != null)
            for(const filter of filters) {
                if(!filter.evaluateField(row))
                    pass = false
            }
        return pass
    }

    evaluateVar(data : string) : string {
        return AbstractDataSource.evaluateVar(data,this.scope)
    }

    static evaluateVar(data : string, scope : any) : string {
        return mustache.render(data,scope)
    }

    abstract close() : Promise<void>

}

export abstract class IComparator {

    operation : string

    constructor(operation : string){
        this.operation = operation
    }

    evaluate(t1 : any, t2 :any) : Boolean {
        if(typeof(t1) != typeof(t2)) {
            t1 = t1?.toString()
            t2 = t2?.toString()
        }
        switch(this.operation) {
            case '<':
                return t1 < t2
            case '>':
                return t1 > t2
            case '=':
            default:
                return t1 == t2
        }
    }
}

export class FieldComparator extends IComparator {
    
    leftSelector : string
    value : any

    constructor(leftSelector : string, value : any, operation : string){
        super(operation)
        this.leftSelector = leftSelector
        this.value = value
    }

    evaluateField(data : any) : Boolean {
        return this.evaluate(Op.fetchValue(data,this.leftSelector),this.value)
    }
}

export class JoinOn extends IComparator {

    leftSelector : string
    rightSelector : string
    

    constructor(leftSelector : string, rightSelector : string, operation : string){
        super(operation)
        this.leftSelector = leftSelector
        this.rightSelector = rightSelector
    }

    evaluateObjects(data1 : any, data2 : any) : Boolean {
        return this.evaluate(Op.fetchValue(data1,this.leftSelector),Op.fetchValue(data2,this.rightSelector))
    }
}