import yaml from 'js-yaml'
import { readFileSync } from 'fs'

export class Config {

    datasources : any

    static config : Config

    private constructor() {
        const data =  readFileSync('./etc/config.yml').toString()
        this.datasources = (yaml.load(data) as any).datasources
    }

    static getInstance() : Config {
        if(this.config == null)
            this.config = new Config()
        return this.config
    }
}