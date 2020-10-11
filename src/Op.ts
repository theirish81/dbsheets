/**
 * The generic operation
 */
export abstract class Op {

    /**
     * Simple path walker using dot notation
     * @param data the data to operate on
     * @param path the path
     */
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