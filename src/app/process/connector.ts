
export class Connector {
    id: string;
    headIndex: number;
    index: number;
    

    constructor(id, headIndex, index, materialInput, outputs, byproducts, energyInputs, transportations, directEmissions) {
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