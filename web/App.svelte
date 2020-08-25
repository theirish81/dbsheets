<script>
    import yaml from 'js-yaml'

    let yamlText = 'yay'

    let sheet = {}

    let params = {}

    function parse(){
        sheet = {... yaml.load(yamlText)}
    }

    function run(){
        
    }
</script>
<div>
    <div>
        <h2>Sheet</h2>
        <div>
            <textarea bind:value={yamlText}/>
        </div>
        <div>
            <button on:click={parse}>Parse</button>
        </div>
    </div>
    <div>
        <h2>Execution</h2>
        <div>
            {#if sheet.params}
                {#each sheet.params as param}
                    <div><input placeholder={param} bind:value={params[param]}/></div>
                {/each}
            {/if}
        </div>
        <div>
            <button on:click={run}>Run</button>
        </div>
    </div>
</div>