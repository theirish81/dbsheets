<script>   
    import yaml from 'js-yaml'
    import axios from 'axios'
    import 'chota'
    import {Field,Input,Button} from 'svelte-chota';
    import { Tabs,Tab } from 'svelte-chota';
 

    let yamlText = ''

    let sheet = null

    let params = {}

    let datasources = []

    let parseError = ''

    let error = ''

    let active_tab = 0;

    $: paramsFilled = function() {
        for(const k in params)
            if(params[k].length == 0)
                return false
        return true
    }

    function parse(){
        try {
            sheet = {... yaml.load(yamlText)}
            document.getElementById('execTab').click()
        }catch(e){
            parseError = e.message
        }
    }

    function run(){
        axios.post('/execute',{sheet:yamlText,params:params})
            .then(it => {
                datasources = [... it.data]
            }).catch(e => {
                error = e.response.data.error
            })
    }
</script>
<style>
</style>
<div>

    <Tabs full bind:active={active_tab}>
        <Tab>Sheet</Tab>
        <Tab id="execTab">Execution</Tab>
    </Tabs>

    <div style="padding:30px; display: {active_tab==0 ? 'block' : 'none'}">
        <div>
            <Field label="Sheet">
                <Input textarea bind:value={yamlText} style="height:400px;font-family: courier"/>
            </Field>
            <div style="color: red">{parseError}</div>
        </div>
        <div>
            <Button on:click={parse} disabled={yamlText.length==0}>Parse</Button>
        </div>
    </div>
    <div style="padding:30px; display: {active_tab==1 ? 'block' : 'none'}">
        <div>
            {#if sheet && sheet.params}
                {#each sheet.params as param}
                    <div>
                        <Field label={param}>
                            <Input placeholder={param} bind:value={params[param]}/>
                        </Field>
                    </div>
                {/each}
            {/if}
        </div>
        <div>
            <Button on:click={run} disabled={sheet==null || !paramsFilled()}>Run</Button>
            <div style="color: red">{error}</div>
        </div>
        <div style="display: {datasources.length > 0 ? 'block' : 'none'}">
            <h2>Datasources</h2>
            {#each datasources as datasource}
                <h3>{datasource.key}</h3>
                <pre>
                    {JSON.stringify(datasource.value,null,2)}
                </pre>
            {/each}
        </div>
    </div>
</div>