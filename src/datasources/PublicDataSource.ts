import { AbstractDataSource } from "./AbstractDataSource";

/**
 * A data source that arranges data for publication
 */
export class PublicDataSource extends AbstractDataSource {

    /**
     * The constructor
     * @param scope the scope
     */
    constructor(scope : any){
        super(null,scope)
    }

    find(params: any): Promise<AbstractDataSource> {
        this.data = []
        return new Promise((resolve, reject) => {
                    params.ds.getData().map((it : any) => {
                        let item : any = {}
                        if(params.rename){
                            for(const k in params.rename) {
                                item[k] = it[params.rename[k]]
                            }
                        } else
                            item = it
                        this.data.push(item)
                    })
                    resolve(this)
                })
    }
    
    close() : Promise<void> {
        return new Promise((resolve,reject) => resolve())
    }

}