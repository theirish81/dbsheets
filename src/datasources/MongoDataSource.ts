import { MongoClient, Cursor, MongoClientOptions, ObjectId } from 'mongodb'
import { AbstractDataSource, FieldComparator } from './AbstractDataSource'

export class MongoDataSource extends AbstractDataSource {

    mongoClient : MongoClient

    constructor(connectionParams : any, scope : any) {
        super(connectionParams,scope)
    }

    async find(params: any) : Promise<MongoDataSource> {
        this.data = []
        this.id = params.var
        if(this.mongoClient == null)
            this.mongoClient = await new MongoClient(this.connectionParams.url.toString(),{ useUnifiedTopology: true } as MongoClientOptions).connect()
        const collectionObject = this.mongoClient.db(this.evaluateVar(params.db))
                                                    .collection(this.evaluateVar(params.collection))
        const cursor = collectionObject.find(this.composeQuery(params.query), {timeout: false})
        const filters = AbstractDataSource.createFilterComparators(params)
        const projections : Array<string> = params.project
        return this.processLine(cursor,filters,projections).then(_ => this)
    }

    private processLine(cursor : Cursor<any>, filters: Array<FieldComparator>, projections : Array<string>) : Promise<void> {
        if(cursor.hasNext() && !cursor.isClosed()){
            return cursor.next().then(row => {
                if(row != null) { 
                    if(AbstractDataSource.accept(row,filters))
                        this.data.push(AbstractDataSource.project(row,projections))
                    return this.processLine(cursor,filters,projections)
                }
            })
        }
        else
            return new Promise((resolve,reject) => resolve())
    }

    composeQuery(query : string) : any {
        const data = JSON.parse(this.evaluateVar(query))
        for(const k in data) {
            if(typeof(data[k])=='object' && '$oid' in data[k])
                data[k] = new ObjectId(data[k]['$oid'])
        }
        return data
    }

    async close() : Promise<void> {
        if(this.mongoClient)
            return this.mongoClient.close()
    }
}