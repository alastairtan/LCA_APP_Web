export class Byproduct {
    coproduct: boolean;
    waste: boolean;
    byproductName: string;
    quantity: string;
    unit: string;
    activityDataOrigin: string;
    downstreamOption: string;
    remarks: string;
    isCollapsed: boolean;

    constructor() {
        this.coproduct = false;
        this.waste = false;
        this.byproductName = '';
        this.quantity = '0';
        this.unit = 'm3';
        this.activityDataOrigin = '';
        this.downstreamOption = '';
        this.remarks = 'N/A';
        this.isCollapsed = false;
    }

    parseData(jsonObj) {
        this.coproduct = jsonObj.coproduct;
        this.waste = jsonObj.waste;
        this.byproductName = jsonObj.byproductName;
        this.quantity = jsonObj.quantity;
        this.unit = jsonObj.unit;
        this.activityDataOrigin = jsonObj.activityDataOrigin;
        this.downstreamOption = jsonObj.downstreamOption;
        this.remarks = jsonObj.remarks;
        this.isCollapsed = jsonObj.isCollapsed;
    }

    equals(other: Byproduct) {
        var isEqual = true;
        isEqual = isEqual && (this.coproduct == other.coproduct);
        isEqual = isEqual && (this.waste == other.waste);
        isEqual = isEqual && (this.byproductName == other.byproductName);
        isEqual = isEqual && (this.quantity == other.quantity);
        isEqual = isEqual && (this.unit == other.unit);
        isEqual = isEqual && (this.activityDataOrigin == other.activityDataOrigin);
        isEqual = isEqual && (this.downstreamOption == other.downstreamOption);
        isEqual = isEqual && (this.remarks == other.remarks);
        return isEqual;
    }

    static areEqual(thisInput: Byproduct, thatInput: Byproduct) {
        var isEqual = true;
        isEqual = isEqual && (thisInput.coproduct == thatInput.coproduct);
        isEqual = isEqual && (thisInput.waste == thatInput.waste);
        isEqual = isEqual && (thisInput.byproductName == thatInput.byproductName);
        isEqual = isEqual && (thisInput.quantity == thatInput.quantity);
        isEqual = isEqual && (thisInput.unit == thatInput.unit);
        isEqual = isEqual && (thisInput.activityDataOrigin == thatInput.activityDataOrigin);
        isEqual = isEqual && (thisInput.downstreamOption == thatInput.downstreamOption);
        isEqual = isEqual && (thisInput.remarks == thatInput.remarks);
        return isEqual;
    }
}
