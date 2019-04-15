import { isEmbeddedView } from "@angular/core/src/view/util";

export class Output {
    functionalUnit: boolean;
    outputName: string;
    to: string[];
    quantity: string;
    unit: string;
    activityDataOrigin: string;
    remarks: string; 
    isCollapsed: boolean;

    constructor() {
        this.functionalUnit = false;
        this.outputName = '';
        this.to = [''];
        this.quantity = '0';
        this.unit = 'm3';
        this.activityDataOrigin = '';
        this.remarks = 'N/A';
        this.isCollapsed = false;
    }

    parseData(jsonObj) {
        this.functionalUnit = jsonObj.functionalUnit;
        this.outputName = jsonObj.outputName;
        this.to = jsonObj.to;
        this.quantity = jsonObj.quantity;
        this.unit = jsonObj.unit;
        this.activityDataOrigin = jsonObj.activityDataOrigin;
        this.remarks = jsonObj.remarks;
        this.isCollapsed = jsonObj.isCollapsed;
    }

    equals(other: Output) {
        var isEqual = true;
        isEqual = isEqual && (this.functionalUnit == other.functionalUnit);
        isEqual = isEqual && (this.outputName == other.outputName);
        isEqual = isEqual && (this.to == other.to);
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
        isEqual = isEqual && (thisInput.to == thatInput.to);
        isEqual = isEqual && (thisInput.quantity == thatInput.quantity);
        isEqual = isEqual && (thisInput.unit == thatInput.unit);
        isEqual = isEqual && (thisInput.activityDataOrigin == thatInput.activityDataOrigin);
        isEqual = isEqual && (thisInput.remarks == thatInput.remarks);
        return isEqual;
    }
}
