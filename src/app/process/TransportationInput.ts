export class TransportationInput {
    transportationType: string;
    quantity: string;
    unit: string;
    activityDataOrigin: string;
    remarks: string;
    isCollapsed: boolean;

    constructor() {
        this.transportationType = '';
        this.quantity = '0';
        this.unit = 'm3';
        this.activityDataOrigin = '';
        this.remarks = 'N/A';
        this.isCollapsed = false;
    }

    parseData(jsonObj) {
        this.transportationType = jsonObj.transportationType;
        this.quantity = jsonObj.quantity;
        this.unit = jsonObj.unit;
        this.activityDataOrigin = jsonObj.activityDataOrigin;
        this.remarks = jsonObj.remarks;
        this.isCollapsed = jsonObj.isCollapsed;
    }

    equals(other: TransportationInput) {
        var isEqual = true;
        isEqual = isEqual && (this.transportationType == other.transportationType);
        isEqual = isEqual && (this.quantity == other.quantity);
        isEqual = isEqual && (this.unit == other.unit);
        isEqual = isEqual && (this.activityDataOrigin == other.activityDataOrigin);
        isEqual = isEqual && (this.remarks == other.remarks);
        return isEqual;
    }

    static areEqual(thisInput: TransportationInput, thatInput: TransportationInput) {
        var isEqual = true;
        isEqual = isEqual && (thisInput.transportationType == thatInput.transportationType);
        isEqual = isEqual && (thisInput.quantity == thatInput.quantity);
        isEqual = isEqual && (thisInput.unit == thatInput.unit);
        isEqual = isEqual && (thisInput.activityDataOrigin == thatInput.activityDataOrigin);
        isEqual = isEqual && (thisInput.remarks == thatInput.remarks);
        return isEqual;
    }
}
