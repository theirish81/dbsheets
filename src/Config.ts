import yaml from 'js-yaml'
import { readFileSync } from 'fs'
/**
 * The configuration
 */
export class Config {

    /**
     * A list of actual datasources with their connection params
     */
    datasources : any

    /**
     * The config singleton
     */
    static config : Config

    /**
     * Private constructor
     */
    private constructor() {
        const data =  readFileSync('./etc/config.yml').toString()
        this.datasources = (yaml.load(data) as any).datasources
    }

    /**
     * Returns the config instance
     */
    static getInstance() : Config {
        if(this.config == null)
            this.config = new Config()
        return this.config
    }
}