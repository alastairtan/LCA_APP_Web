export class Output {
    functionalUnit: boolean;
    outputName: string;
    quantity: string;
    unit: string;
    activityDataOrigin: string;
    remarks: string; 

    constructor() {
        this.functionalUnit = false;
        this.outputName = '';
        this.quantity = '0';
        this.unit = '';
        this.activityDataOrigin = '';
        this.remarks = 'N/A';
    }

    equals(other: Output) {
        var isEqual = true;
        isEqual = isEqual && (this.functionalUnit == other.functionalUnit);
        isEqual = isEqual && (this.outputName == other.outputName);
        isEqual = isEqual && (this.quantity == other.quantity);
        isEqual = isEqual && (this.unit == other.unit);
        isEqual = isEqual && (this.activityDataOrigin == other.activityDataOrigin);
        isEqual = isEqual && (this.remarks == other.remarks);
        return isEqual;
    }

    static areEqual(thisInput: Output, thatInput: Output) {
        var isEqual = true;
        isEqual = isEqual && (thisInput.functionalUnit == thatInput.functionalUnit);
        isEqual = isEqual && (thisInput.outputName == thatInput.outputName);
        isEqual = isEqual && (thisInput.quantity == thatInput.quantity);
        isEqual = isEqual && (thisInput.unit == thatInput.unit);
        isEqual = isEqual && (thisInput.activityDataOrigin == thatInput.activityDataOrigin);
        isEqual = isEqual && (thisInput.remarks == thatInput.remarks);
        return isEqual;
    }
}
