
export class Connector {
    id: string;
    headIndex: number;
    index: number; // index of the connector in an array
    

    constructor(id, headIndex, index) {
        this.id = id;
        this.headIndex = headIndex;
        this.index = index;
    }
    equals(other: Connector) {
        var isEqual = true;
        //Compare the length of each processNode details
       
        if (!isEqual) {
            return false;
        }
        
        return isEqual;
    }
}