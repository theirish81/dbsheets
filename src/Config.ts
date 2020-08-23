import yaml from 'yaml'
import { readFileSync } from 'fs'

export class Config {

    datasources : any

    static config : Config

    private constructor() {
        const data =  readFileSync('./etc/config.yml').toString()
        this.datasources = yaml.parse(data).datasources
    }

    static getInstance() : Config {
        if(this.config == null)
            this.config = new Config()
        return this.config
    }
}