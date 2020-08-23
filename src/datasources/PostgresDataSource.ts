import { Client } from 'pg'
import { AbstractDataSource } from './AbstractDataSource'
export class PostgresDataSource extends AbstractDataSource {

    client : Client

    constructor(connectionParams : any, scope : any){
        super(connectionParams,scope)
    }

    async find(params : any) : Promise<PostgresDataSource> {
        this.data = []
        this.id = params.var
        if(this.client == null){
            this.client = new Client(this.connectionParams)
            await this.client.connect()
        }
        const iterator = await this.client.query(this.evaluateVar(params.query as string))
        const filters = AbstractDataSource.createFilterComparators(params)
        for(const row of iterator.rows){
            if(AbstractDataSource.accept(row,filters))
                this.data.push(AbstractDataSource.project(row,params.project))
        }
        return this
    }

    async close() : Promise<void> {
        if(this.client)
            return await this.client.end()
    }
}