import { Config } from "../Config"
import mustache from 'mustache'
import { Op } from "../Op"

/**
 * An Abstract data source
 */
export abstract class AbstractDataSource extends Op {

    /**
     * Connection parameters
     */
    connectionParams : any

    /**
     * The extracted data, populated once the data source evaluates
     */
    protected data : Array<any>

    /**
     * 
     */
    id : string

    /**
     * The scope
     */
    scope : any

    /**
     * Constructor
     * @param connectionParams the connection params. Null is an acceptable value
     * @param scope the scope
     */
    constructor(connectionParams : any = null, scope : any) {
        super()
        if(typeof(connectionParams)=='string')
            this.connectionParams = Config.getInstance().datasources[connectionParams]
        else
            this.connectionParams = connectionParams
        this.data = new Array<any>()
        this.scope = scope
    }

    /**
     * Returns the data
     */
    getData() : Array<any> {
        return this.data
    }

    /**
     * Executes a find, given a certain set of parameters
     * @param params parameters
     */
    abstract find(params : any ) : Promise<AbstractDataSource>

    /**
     * Executes a data projection of a data row
     * @param row a row
     * @param projections a list of fields that need to be included in this projection
     */
    static project(row : any, projections: Array<string> ) : any {
        if(projections == null)
            return row
        const item : any = {}
        projections.forEach(key => item[key] = row[key])
        return item
    }

    /**
     * Creates an array of FieldComparators given the operation data structure
     * @param operation the operation data structure
     */
    static createFilterComparators(operation : any) : Array<FieldComparator> {
        return operation.accept?.map((it : any) => new FieldComparator(it.leftSelector,it.value,it.operation))
    }

    /**
     * Given a row of data and an array of FieldComparators, it determines whether the row should be included
     * or not.
     * @param row the row
     * @param filters the array of FieldComparators
     */
    static accept(row : any,filters : Array<FieldComparator>) : any {
        let pass = true
        if(filters != null)
            for(const filter of filters) {
                if(!filter.evaluateField(row))
                    pass = false
            }
        return pass
    }

    /**
     * Evaluates a template
     * @param data the template
     */
    evaluateVar(data : string) : string {
        return AbstractDataSource.evaluateVar(data,this.scope)
    }

    /**
     * Evaluates a template, given a certain scope
     * @param data the template
     * @param scope the scope
     */
    static evaluateVar(data : string, scope : any) : string {
        return mustache.render(data,scope)
    }

    /**
     * Closes the data source
     */
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