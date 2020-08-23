import { AbstractDataSource, JoinOn, FieldComparator } from "./AbstractDataSource";

export class JoinedDataSource extends AbstractDataSource {

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