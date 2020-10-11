import { AbstractDataSource, JoinOn, FieldComparator } from "./AbstractDataSource";

/**
 * A data source that joins two data sources together
 */
export class JoinedDataSource extends AbstractDataSource {

    /**
     * The constructor
     * @param id the ID of the operation
     * @param scope the scope
     */
    constructor(id : string, scope : any){
        super(null,scope)
        this.id = id
    }

    find(params : any) : Promise<JoinedDataSource>{
        this.data = []
        return new Promise((resolve,reject) =>
                resolve(JoinedDataSource.joinData(params.ds1.id,params.ds1.getData(),
                                                    params.ds2.id,params.ds2.getData(),
                                                    params.joinOn, AbstractDataSource.createFilterComparators(params),
                                                    params.project)))
                    .then((it : Array<any>) => {
                        this.data = it
                        return this
                    })
    }

    /**
     * Left joins two data sets
     * @param leftTable the name of the left table
     * @param left the left data
     * @param rightTable the name of the right table
     * @param right the right data
     * @param joinOn the join conditions
     * @param filters extra filters to accept/discard rows
     * @param projections projections to discard the fields that are not necessary
     */
    static joinData(leftTable : string, left : Array<any>, rightTable : string, right : Array<any>,
                    joinOn : JoinOn, filters : FieldComparator[], projections : Array<string>) : Array<any> {
        const data = new Array<any>()
        left.forEach(leftIt => {
            right.filter(rightIt => joinOn.evaluateObjects(leftIt,rightIt))
                            .forEach(rightSelection => {
                                const item : any = {}
                                for(const leftKey in leftIt){
                                    item[this.key(leftTable,leftKey)] = leftIt[leftKey]
                                }
                                for(const rightKey in rightSelection){
                                    item[this.key(rightTable,rightKey)] = rightSelection[rightKey]
                                }
                                if(AbstractDataSource.accept(item,filters))
                                    data.push(AbstractDataSource.project(item,projections))
                            })
                })
                
        return data
    }

    /**
     * Produces a new key given a the name of a table and the key of the field
     * @param leftTable the name of the left table
     * @param leftKey the key of the field
     */
    static key(leftTable : string,leftKey : string) : string{
        let key = leftKey
        if(leftTable)
            key = leftTable+'->'+key
        return key
    }

    close() : Promise<void> {
        return new Promise((resolve,reject) => resolve())
    }
}