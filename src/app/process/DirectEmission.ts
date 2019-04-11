export class DirectEmission {
    emissionType: string;
    quantity: string;
    unit: string;
    activityDataOrigin: string;
    remarks: string;
    isCollapsed: boolean;

    constructor() {
        this.emissionType = '';
        this.quantity = '0';
        this.unit = 'm3';
        this.activityDataOrigin = '';
        this.remarks = 'N/A';
        this.isCollapsed = false;
    }

    parseData(jsonObj) {
        this.emissionType = jsonObj.emissionType;
        this.quantity = jsonObj.quantity;
        this.unit = jsonObj.unit;
        this.activityDataOrigin = jsonObj.activityDataOrigin;
        this.remarks = jsonObj.remarks;
        this.isCollapsed = jsonObj.isCollapsed;
    }

    equals(other: DirectEmission) {
        var isEqual = true;
        isEqual = isEqual && (this.emissionType == other.emissionType);
        isEqual = isEqual && (this.quantity == other.quantity);
        isEqual = isEqual && (this.unit == other.unit);
        isEqual = isEqual && (this.activityDataOrigin == other.activityDataOrigin);
        isEqual = isEqual && (this.remarks == other.remarks);
        return isEqual;
    }

    static areEqual(thisInput: DirectEmission, thatInput: DirectEmission) {
        var isEqual = true;
        isEqual = isEqual && (thisInput.emissionType == thatInput.emissionType);
        isEqual = isEqual && (thisInput.quantity == thatInput.quantity);
        isEqual = isEqual && (thisInput.unit == thatInput.unit);
        isEqual = isEqual && (thisInput.activityDataOrigin == thatInput.activityDataOrigin);
        isEqual = isEqual && (thisInput.remarks == thatInput.remarks);
        return isEqual;
    }
}
