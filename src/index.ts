import { readFileSync } from 'fs'
import yaml from 'yaml'
import yargs from 'yargs'
import { Sheet } from './Sheet'
import { PublicDataSource } from './datasources/PublicDataSource'
import util from 'util'
const ObjectsToCsv = require('objects-to-csv')
const asTable = require('as-table')



const options = yargs.option("i",{describe:"The path to a query sheet", type:"string", demandOption:true})
                    .option("f",{describe:"Select output format [javascript,json,table,csv]",type:"string",default:"javascript"})
                    .option("v",{describe:"A key:value variable",type:"string"})
                    .version("0.1.0").argv
doSheet(options.i,options.f, convertVars(options.v))

function convertVars(data : any) : any {
    if(data == null)
        return {}
    const out : any = {}
    if(typeof(data)=='string'){
        data = [data]
    }
    for(const item of data){
        const tmp = convertVar(item)
        out[tmp[0]] = tmp[1]
    }
    return out
    
}

function convertVar(data : any): Array<string> {
    return data.split(':')
}

async function doSheet(path : string, format : string, vars : any) {
    const data = yaml.parse(readFileSync(path).toString())
    const sheet = new Sheet(data,vars)
    sheet.process().then(_ => {
        sheet.sheetScope.forEach((datasource,key) => {
            if( datasource instanceof PublicDataSource ){
                console.log("Datasource : "+key)
                switch(format){
                    case 'table':
                        console.log(asTable(datasource.getData()))
                        break
                    case 'csv':
                        new ObjectsToCsv(datasource.getData()).toString().then((it : any) => console.log(it))
                        break
                    case 'json':
                        console.log(JSON.stringify(datasource.getData(),null,2))
                        break
                    default:
                        console.log(util.inspect(datasource.getData(), {showHidden:false, depth:null, colors:true}))
                }
                
            }
        })
    }).catch(e => { console.log('Error',e.message)})
    
}