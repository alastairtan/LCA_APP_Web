export class EnergyInput {
    equipmentName: string;
    energyType: string;
    processTime: string;
    rating: string;
    quantity: string;
    unit: string;
    activityDataOrigin: string;
    emissionFactorData: string;
    emissionFactorSource: string;
    remarks: string;
    isCollapsed: boolean;

    constructor() {
        this.equipmentName = '';
        this.energyType = '';
        this.processTime = '0';
        this.rating = '0.0001';
        this.quantity = '0';
        this.unit = 'm3';
        this.activityDataOrigin = '';
        this.emissionFactorData = '';
        this.emissionFactorSource = '';
        this.remarks = 'N/A';
        this.isCollapsed = false;
    }

    parseData(jsonObj) {
        this.equipmentName = jsonObj.equipmentName;
        this.energyType = jsonObj.energyType;
        this.processTime = jsonObj.processTime;
        this.rating = jsonObj.rating;
        this.quantity = jsonObj.quantity;
        this.unit = jsonObj.unit;
        this.activityDataOrigin = jsonObj.activityDataOrigin;
        this.emissionFactorData = jsonObj.emissionFactorData;
        this.emissionFactorSource = jsonObj.emissionFactorSource;
        this.remarks = jsonObj.remarks;
        this.isCollapsed = jsonObj.isCollapsed;
    }

    equals(other: EnergyInput) {
        var isEqual = true;
        isEqual = isEqual && (this.equipmentName == other.equipmentName);
        isEqual = isEqual && (this.energyType == other.energyType);
        isEqual = isEqual && (this.processTime == other.processTime);
        isEqual = isEqual && (this.rating == other.rating);
        isEqual = isEqual && (this.quantity == other.quantity);
        isEqual = isEqual && (this.unit == other.unit);
        isEqual = isEqual && (this.activityDataOrigin == other.activityDataOrigin);
        isEqual = isEqual && (this.emissionFactorData == other.emissionFactorData);
        isEqual = isEqual && (this.emissionFactorSource == other.emissionFactorSource);
        isEqual = isEqual && (this.remarks == other.remarks);
        return isEqual;
    }

    static areEqual(thisInput: EnergyInput, thatInput: EnergyInput) {
        var isEqual = true;
        isEqual = isEqual && (thisInput.equipmentName == thatInput.equipmentName);
        isEqual = isEqual && (thisInput.energyType == thatInput.energyType);
        isEqual = isEqual && (thisInput.processTime == thatInput.processTime);
        isEqual = isEqual && (thisInput.rating == thatInput.rating);
        isEqual = isEqual && (thisInput.quantity == thatInput.quantity);
        isEqual = isEqual && (thisInput.unit == thatInput.unit);
        isEqual = isEqual && (thisInput.activityDataOrigin == thatInput.activityDataOrigin);
        isEqual = isEqual && (thisInput.emissionFactorData == thatInput.emissionFactorData);
        isEqual = isEqual && (thisInput.emissionFactorSource == thatInput.emissionFactorSource);
        isEqual = isEqual && (thisInput.remarks == thatInput.remarks);
        return isEqual;
    }
}
