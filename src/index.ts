import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import yargs from 'yargs'
import { Sheet } from './Sheet'
import { PublicDataSource } from './datasources/PublicDataSource'
import express from 'express'
import util from 'util'
import path from 'path'
import fs from 'fs'
import bp from 'body-parser'
const ObjectsToCsv = require('objects-to-csv')
const asTable = require('as-table')



const options = yargs.option("i",{describe:"The path to a query sheet", type:"string"})
                    .option("f",{describe:"Select output format [javascript,json,table,csv]",type:"string",default:"javascript"})
                    .option("v",{describe:"A key:value variable",type:"string"})
                    .option("S",{describe:"Runs the HTTP server"})
                    .version("0.1.0").argv

if(!options.i && !options.S){
    console.log("Either -i or -S must be present")
    yargs.showHelp()
} else {
    if(options.i)
        doSheet(options.i,options.f, convertVars(options.v))
    if(options.S) {
        runServer()
    }
}

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
    let data : any = yaml.load(readFileSync(path).toString())
    data = (data instanceof Array) ? data : data.steps
    const sheet = new Sheet(data,vars)
    sheet.process().then(_ => {
        const count = sheet.resultsCount()
        sheet.sheetScope.forEach((datasource,key) => {
            if( datasource instanceof PublicDataSource ){
                if( count > 1 )
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

function runServer() {
    const app = express()
    console.log(path.join(__dirname,'public'))
    app.use (express.static (path.join (__dirname, 'public')));
    app.use(bp.json())
    app.get("/",(req, res, next) => {
        res.send(fs.readFileSync ('./public/index.ejs', { encoding: 'UTF-8' }))
    })
    app.post("/execute",(req,res,next) => {
        let data : any = yaml.load(req.body.sheet)
        data = (data instanceof Array) ? data : data.steps
        const sheet = new Sheet(data,req.body.params)
        sheet.process().then(_ => {
            const out : Array<any> = []
            sheet.sheetScope.forEach((datasource,key) => {
                if( datasource instanceof PublicDataSource ){
                    out.push({key:key,value:datasource.getData()})
                }
            })
            res.send(out)
        }).catch(e => {
            res.statusCode = 500
            res.send({'error':e.message})
        })
    })
    app.listen(5000)
}