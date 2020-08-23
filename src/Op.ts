export abstract class Op {

    public static fetchValue(data : any, path : string) {
        if(path.indexOf('.') > -1) {
            if(path in data)
                return data[path]
            else {
                let currentItem = data
                path.split('.').forEach(it => {
                    if(currentItem != null)
                        currentItem = currentItem[it]
                })
                return currentItem
            }

        } else {
            return data[path]
        }
    }
}