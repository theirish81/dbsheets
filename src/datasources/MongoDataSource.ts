import { MongoClient, Cursor, MongoClientOptions, ObjectId } from 'mongodb'
import { AbstractDataSource, FieldComparator } from './AbstractDataSource'

/**
 * The MongoDB datasource
 */
export class MongoDataSource extends AbstractDataSource {

    /**
     * The Mongo Client
     */
    mongoClient : MongoClient

    /**
     * The Constructor
     * @param connectionParams connection params
     * @param scope the scope
     */
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

    /**
     * The MongoDB datasource has the ability to perform updates
     * @param params the params
     */
    async update(params: any) : Promise<MongoDataSource> {
        this.data = []
        this.id = params.var
        if(this.mongoClient == null)
            this.mongoClient = await new MongoClient(this.connectionParams.url.toString(),{ useUnifiedTopology: true } as MongoClientOptions).connect()
        const collectionObject = this.mongoClient.db(this.evaluateVar(params.db))
            .collection(this.evaluateVar(params.collection))
        const updateData = collectionObject.updateMany(this.composeQuery(params.query),this.composeQuery(params.update))
        return updateData.then(result => {
                this.data = [result]
                return this
        })
    }

    /**
     * Processes all documents in a cursor in a recursive fashion
     * @param cursor the MongoDB cursor
     * @param filters the filters
     * @param projections the projections
     */
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